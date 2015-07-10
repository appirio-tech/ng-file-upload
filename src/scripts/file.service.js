(function () {
  'use strict';

  angular
    .module('ap-file-upload')
    .factory('File', File);

  File.$inject = ['$q', '$http'];

  function File($q, $http) {

    function File(data, options) {
      var file = this;

      // Public properties
      file.data = data;
      file.name = data.name;
      file.locked = options.locked || false;
      file.urlPresigner = options.urlPresigner;

      // Initialize
      file._upload();

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
      this.onRemove(this);
    }

    File.prototype.onRemove = function() { /* noop */ }
    File.prototype.onSuccess = function() { /* noop */ }
    File.prototype.onFailure = function() { /* noop */ }

    //
    // Private methods
    //

    File.prototype._getPresignedUrl = function() {
      var deferred = $q.defer();
      var name = encodeURIComponent('&fileName=' + this.name);
      var url = this.urlPresigner + name;

      $http({
        method: 'GET',
        url: url
      })

      .success(function(data){
        deferred.resolve(data);
      })

      .error(function(data){
        deferred.reject()
      });

      return deferred.promise;
    };

    File.prototype._upload = function() {
      var file = this;

      file.status = 'started';
      file.progress = 0;

      file._getPresignedUrl()

      .then(function(data) {
        console.log('success', data);
        var preSignedUrlUpload = data.result.content.preSignedUrlUpload;
        var xhr = file._xhr = new XMLHttpRequest();
        var formData = new FormData();

        formData.append('file', file.data);

        xhr.upload.onprogress = file._onProgress.bind(file);
        xhr.onload = file._onLoad.bind(file);
        xhr.onerror = file._onError.bind(file);
        xhr.onabort = file._onAbort.bind(file);

        xhr.open('POST', preSignedUrlUpload, true);
        xhr.send(formData);
      })

      .catch(function(data) {
        console.log('error', data);
        file.status = 'failed';
        file.onFailure(response);
      })
      
    };

    File.prototype._onProgress = function(e) {
      this.progress = Math.round(e.lengthComputable ? e.loaded * 100 / e.total : 0);
    }

    File.prototype._onLoad = function() {
      var response = this._transformResponse(this._xhr);

      if (this._isSuccessCode(this._xhr.status)) {
        this.status = 'succeeded';
        this.onSuccess(response);
      } else {
        this.status = 'failed';
        this.onFailure(response);
      }
    }

    File.prototype._onError = function() {
      var response = this._transformResponse(this._xhr);
      this.onFailure(response);
    }

    File.prototype._onAbort = function() {
      this.remove();
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
