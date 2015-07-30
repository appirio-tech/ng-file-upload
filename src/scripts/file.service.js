(function () {
  'use strict';

  angular
    .module('ap-file-upload')
    .factory('File', File);

  File.$inject = ['$q', '$http'];

  function File($q, $http) {

    function File(data, options) {
      var file = this;

      file.data = data;
      file.name = data.name;
      file.newFile = options.newFile !== false;
      file.locked = options.locked || false;
      file.$fileResource = options.$fileResource;
      file.$presignResource = options.$presignResource;

      file.saveParams = {};
      file.saveParams.param = angular.copy(options.saveParams);
      file.saveParams.param.fileName = file.data.name;
      file.saveParams.param.fileType = file.data.type;
      file.saveParams.param.fileSize = file.data.size;

      if (!file.newFile) {
        file.fileId = options.fileId;
        file.uploading = false;
        file.hasErrors = false;
      }

      return file;
    }

    //
    // Public methods
    //

    File.prototype.start = function() {
      this._upload();
    };

    File.prototype.retry = function() {
      this._upload();
    };

    File.prototype.cancel = function() {
      if (this._xhr) {
        this._xhr.abort();
      } else {
        this.onRemove(this);
      }
    };

    File.prototype.remove = function() {
      var deferred = $q.defer();
      var file = this;

      var $promise = file._deleteFileRecord();

      $promise.then(function(){
        file.onRemove(file);
        deferred.resolve();
      });

      $promise.catch(function(){
        deferred.reject();
      });

      return deferred.promise;
    };

    File.prototype.onStart = function() { /* noop */ };
    File.prototype.onRemove = function() { /* noop */ };
    File.prototype.onProgress = function() { /* noop */ };
    File.prototype.onSuccess = function() { /* noop */ };
    File.prototype.onFailure = function() { /* noop */ };

    //
    // Private methods
    //

    File.prototype._upload = function() {
      var file = this;

      file.uploading = true;
      file.hasErrors = false;
      file.progress = 0;

      file.onStart();

      var $promise = file._getPresignedUrl();

      $promise.then(function(response) {
        if (!response.result.content) {
          return file._failed('Could not get presigned URL from server');
        }
        
        file.preSignedUrlUpload = response.result.content.preSignedUrlUpload;

        var xhr = file._xhr = new XMLHttpRequest();
        var formData = new FormData();

        formData.append(file.data.name, file.data);

        xhr.upload.onprogress = file._onProgress.bind(file);
        xhr.onload = file._onLoad.bind(file);
        xhr.onerror = file._onError.bind(file);
        xhr.onabort = file._onAbort.bind(file);

        xhr.open('PUT', file.preSignedUrlUpload, true);
        xhr.setRequestHeader('Content-Type', 'multipart/form-data');
        xhr.send(formData);
      });

      $promise.catch(function(data) {
        file._failed('Could not get presigned URL from server');
      });
      
    };

    File.prototype._createFileRecord = function() {
      return this.$fileResource.save(this.saveParams).$promise;
    };

    File.prototype._deleteFileRecord = function() {
      return this.$fileResource.delete({
        fileId: this.fileId
      }).$promise;
    };

    File.prototype._getPresignedUrl = function() {
      return this.$presignResource.save(this.saveParams).$promise;
    };

    File.prototype._onProgress = function(e) {
      this.progress = Math.round(e.lengthComputable ? e.loaded * 100 / e.total : 0);
    };

    File.prototype._onLoad = function() {
      var file = this;
      var response = file._transformResponse(file._xhr);

      if (file._isSuccessCode(file._xhr.status)) {

        var $promise = file._createFileRecord();

        $promise.then(function(data) {
          file.fileId = data.result.content.fileId;
          file.hasErrors = false;
          file.uploading = false;
          file.onSuccess(response);
        });

        $promise.catch(function() {
          file._failed('Could not create file record in database');
        });

      } else {
        file._failed('Could not upload file to S3');
      }

    };

    File.prototype._onError = function() {
      var response = this._transformResponse(this._xhr);
      this._failed('Could not connect to S3');
    };

    File.prototype._onAbort = function() {
      this.onRemove(this);
    };

    File.prototype._failed = function(msg) {
      var file = this;
      console.log(msg);
      file.hasErrors = true;
      file.uploading = false;
      file.onFailure(msg);
    };

    //
    // Helper methods
    //

    File.prototype._parseHeaders = function(headers) {
      var parsed = {}, key, val, i;

      if (!headers) return parsed;

      angular.forEach(headers.split('\n'), function(line) {
        i = line.indexOf(':');
        key = line.slice(0, i).trim().toLowerCase();
        val = line.slice(i + 1).trim();

        if (key) {
          parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
        }
      });

      return parsed;
    };

    File.prototype._transformResponse = function(xhr) {
      var headers = this._parseHeaders(xhr.getAllResponseHeaders());
      var response = xhr.response;
      var headersGetter = this._headersGetter(headers);
      angular.forEach($http.defaults.transformResponse, function(transformFn) {
        response = transformFn(response, headersGetter);
      });
      return response;
    };

    File.prototype._headersGetter = function(parsedHeaders) {
      return function(name) {
        if (name) {
          return parsedHeaders[name.toLowerCase()] || null;
        }
        return parsedHeaders;
      };
    };

    File.prototype._isSuccessCode = function(status) {
      return (status >= 200 && status < 300) || status === 304;
    };

    return File;

  }
})();
