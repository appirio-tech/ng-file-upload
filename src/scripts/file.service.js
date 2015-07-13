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

      if (file.newFile) {
        file._upload();
      } else {
        file.fileId = options.fileId;
        file.status = 'succeeded';
      }

      return file;
    }

    //
    // Public methods
    //

    File.prototype.retry = function() {
      this._upload();
    }

    File.prototype.cancel = function() {
      this._xhr.abort();
    }

    File.prototype.remove = function() {
      var file = this;

      var $promise = file._deleteFileRecord();

      $promise.then(function(){
        file.onRemove(file);
      });

      $promise.catch(function(){
      });
    }

    File.prototype.onRemove = function() { /* noop */ }
    File.prototype.onProgress = function() { /* noop */ }
    File.prototype.onSuccess = function() { /* noop */ }
    File.prototype.onFailure = function() { /* noop */ }

    //
    // Private methods
    //

    File.prototype._upload = function() {
      var file = this;

      file.status = 'started';
      file.progress = 0;

      var $promise = file._getPresignedUrl();

      $promise.then(function(data) {
        file.preSignedUrlUpload = data.result.content.preSignedUrlUpload;

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
        file.status = 'failed';
        file.onFailure(response);
      });
      
    };

    File.prototype._createFileRecord = function() {
      return this.$fileResource.save({
        param: {
          workRequestId: "1436372805000-66d14ff5-ec15-410f-8c51-98e18e75f0fe",
          fileName: this.data.name,
          fileType: this.data.type,
          fileSize: this.data.size,
          assetType: "specs"        
        }
      }).$promise;
    };

    File.prototype._deleteFileRecord = function() {
      return this.$fileResource.delete({
        fileId: this.fileId
      }).$promise;
    };

    File.prototype._getPresignedUrl = function() {
      return this.$presignResource.get({
        name: this.name
      }).$promise;
    };

    File.prototype._onProgress = function(e) {
      this.progress = Math.round(e.lengthComputable ? e.loaded * 100 / e.total : 0);
    }

    File.prototype._onLoad = function() {
      var file = this;
      var response = file._transformResponse(file._xhr);

      if (file._isSuccessCode(file._xhr.status)) {

        var $promise = file._createFileRecord();

        $promise.then(function(data) {
          file.fileId = data.result.content.fileId;
          file.status = 'succeeded';
          file.onSuccess(response);
        });

        $promise.catch(function() {
          file.status = 'failed';
          file.onFailure(response);
        });

      } else {
        file.status = 'failed';
        file.onFailure(response);
      }

    }

    File.prototype._onError = function() {
      var response = this._transformResponse(this._xhr);
      this.onFailure(response);
    }

    File.prototype._onAbort = function() {
      this.onRemove(this);
    }

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
