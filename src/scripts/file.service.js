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
      }

      this.onRemove(this);
    };

    File.prototype.remove = function() {
      var file = this;
      var $promise = file._deleteFileRecord();

      return $promise.then(function(){
        file.onRemove(file);
      });

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

      file._getPresignedUrl()
        .then(transformResponse)
        .then(storeFilePath.bind(file))
        .then(storePresignedUrl.bind(file))
        .then(uploadToS3.bind(file))
        .then(checkSuccessCode.bind(file))
        .then(transformXhrResponse.bind(file))
        .then(createFileRecord.bind(file))
        .then(fileRecordSuccess.bind(file))
        .catch(function(err) {
          file._failed(err);
        });
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

    File.prototype._failed = function(err) {
      var file = this;
      console.log(err);
      file.hasErrors = true;
      file.uploading = false;
      file.onFailure(err);
    };

    //
    // Helper methods
    //

    function transformResponse(response) {
      return response.result.content;
    }

    function storeFilePath(content) {
      this.saveParams.param.filePath = content.filePath;
      return content;
    }

    function storePresignedUrl(content) {
      var preSignedURL = content.preSignedURL;

      if (preSignedURL) {
        this.preSignedURL = preSignedURL;
        return true;
      } else {
        throw 'Response from presigned URL request had no presigned URL';
      }
    }

    function uploadToS3() {
      var file = this;
      var deferred = $q.defer();
      var xhr = file._xhr = new XMLHttpRequest();

      xhr.upload.onprogress = file._onProgress.bind(file);

      xhr.onload = function() {
        deferred.resolve();
      };

      xhr.onerror = function() {
        deferred.reject();
      };

      xhr.open('PUT', file.preSignedURL, true);
      xhr.setRequestHeader('Content-Type', file.data.type);
      xhr.send(file.data);

      return deferred.promise;
    }

    function checkSuccessCode() {
      var status = this._xhr.status;

      if ((status >= 200 && status < 300) || status === 304) {
        return true;
      } else {
        throw 'File upload to S3 failed: ' + status;
      }
    }

    function transformXhrResponse() {
      var xhr = this._xhr;
      var headers = parseHeaders(xhr.getAllResponseHeaders());
      var response = xhr.response;
      var headersGetter = headersGetter(headers);

      angular.forEach($http.defaults.transformResponse, function(transformFn) {
        response = transformFn(response, headersGetter);
      });

      return response;
    }

    function createFileRecord() {
      return this.$fileResource.save(this.saveParams).$promise;
    }

    function fileRecordSuccess(response) {
      file.fileId = data.result.content.fileId;
      file.hasErrors = false;
      file.uploading = false;
      file.onSuccess(response);
    }

    function parseHeaders(headers) {
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
    }

    function headersGetter(parsedHeaders) {
      return function(name) {
        if (name) {
          return parsedHeaders[name.toLowerCase()] || null;
        }
        return parsedHeaders;
      };
    }

    return File;

  }
})();
