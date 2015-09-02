(function () {
  'use strict';

  angular.module('ap-file-upload', [
    'ngResource'
  ]);

})();
(function () {
  'use strict';

  angular
    .module('ap-file-upload')
    .factory('UploaderService', UploaderService);

  UploaderService.$inject = ['$q', 'File', '$resource'];
  /* @ngInject */
  function UploaderService($q, File, $resource) {

    var uploaderRegistry = {};

    function getUploader(name) {
      if (uploaderRegistry[name]) {
        return uploaderRegistry[name];
      } else {
        var uploader = new Uploader();
        uploaderRegistry[name] = uploader;
        return uploader;
      }
    }

    function Uploader() {
      this.files = [];
      this.uploading = null;
      this.hasErrors = null;
    }

    Uploader.prototype.config = function(options) {
      options = options || {};

      this.allowMultiple = options.allowMultiple || false;
      this.allowDuplicates = options.allowDuplicates || false;
      this.$fileResource = $resource(options.fileEndpoint);
      this.$presignResource = $resource(options.urlPresigner);
      this.saveParams = options.saveParams || {};
    };

    Uploader.prototype.populate = function(queryUrl) {
      this._populate(queryUrl);
    };

    Uploader.prototype.add = function(files, options) {
      var uploader = this;
      options = options || {};
      files = filelistToArray(files);

      // Fail if we're trying to add multiple files to a single upload
      if (files.length > 1 && uploader.allowMultiple === false) {
        deferred.reject('NOTMULTI');
      }

      return $q.all(files.map(function(file){
        return uploader._add(file, options);
      }));
    };

    Uploader.prototype.onUpdate = function() {
      var uploader = this;
      var uploading = false;
      var hasErrors = false;

      uploader.files.forEach(function(file) {
        if (file.uploading === true) {
          uploading = true;
        } else if (file.hasErrors === true) {
          hasErrors = true;
        }
      });

      uploader.uploading = uploading;
      uploader.hasErrors = hasErrors;
    };

    Uploader.prototype._add = function(file, options) {
      options = options || {};
      var deferred = $q.defer();
      var uploader = this;

      // TODO: Prompt user to confirm replacing file
      var replace = true;
      var dupePosition = uploader._indexOfFilename(file.name);
      var dupe = dupePosition >= 0;

      var file = uploader._newFile(file, options);

      if (dupe) {
        if (replace) {
          uploader.files[dupePosition].remove().then(function() {
            uploader.files[dupePosition] = file;
          });
        } else {
          deferred.reject('DUPE');
        }
      } else {
        if (uploader.allowMultiple) {
          uploader.files.push(file);
        } else {
          if (uploader.files[0]) {
            uploader.files[0].remove().then(function() {
              uploader.files[0] = file;
            });
          } else {
            uploader.files[0] = file;
          }
        }
      }

      if (file.newFile) {
        file.start();
      }

      deferred.resolve();

      return deferred.promise;
    };

    Uploader.prototype._populate = function(queryUrl) {
      var uploader = this;
      var $promise = $resource(queryUrl).get().$promise;

      $promise.then(function(data) {
        var files = data.result.content || [];

        files.forEach(function(file) {
          uploader._add({
            name: file.fileName
          }, {
            newFile: false,
            fileId: file.fileId
          });
        });
      });
    };

    Uploader.prototype._newFile = function(file, options) {
      var uploader = this;

      options.$presignResource = uploader.$presignResource;
      options.$fileResource = uploader.$fileResource;
      options.saveParams = uploader.saveParams;

      file = new File(file, options);

      file.onStart = function(response) {
        uploader.onUpdate();
      };

      file.onProgress = function(response) {
        uploader.onUpdate();
      };

      file.onSuccess = function(response) {
        uploader.onUpdate();
      };

      file.onFailure = function(response) {
        uploader.onUpdate();
      };

      file.onRemove = function(file) {
        uploader._remove(file);
      };

      return file;
    };

    Uploader.prototype._remove = function(file) {
      var deferred = $q.defer();
      this.files.splice(this._indexOfFilename(file.name), 1);

      deferred.resolve();
      return deferred.promise;
    };

    Uploader.prototype._indexOfFilename = function(name) {
      var uploader = this;

      for (var i = 0; i < uploader.files.length; i++) {
        if (uploader.files[i].name === name) return i;
      }

      return -1;
    };

    function filelistToArray(collection) {
      var array = [];
      for (var i = 0; i < collection.length; i++) {
        array[i] = collection[i];
      }
      return array;
    }

    return {
      get: getUploader
    };

  }
})();

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

(function () {
  'use strict';

  // Gets around Angular's inability to bind to file input's change event
  // See https://github.com/angular/angular.js/issues/1375
  angular.module('ap-file-upload').directive('onFileChange', onFileChangeDirective);

  onFileChangeDirective.$inject = [];

  function onFileChangeDirective() {
    return {
      restrict: 'A',
      scope: {
        onFileChange: '&'
      },
      link: function(scope, element, attr, ctrl) {
        element.bind("change", function() {
          scope.onFileChange({fileList : element[0].files});
          this.value = '';
        });
      }
    }
  };

})();
(function () {
  'use strict';

  angular.module('ap-file-upload').directive('apUploader', apUploader);

  apUploader.$inject = [];

  function apUploader() {
    return {
      scope: {
        uploading: '=',
        hasErrors: '=',
        config: '='
      },
      controller: 'UploaderController as vm',
      templateUrl: 'uploader.html'
    }
  };

})();
(function () {
  'use strict';

  angular
    .module('ap-file-upload')
    .controller('UploaderController', UploaderController);

  UploaderController.$inject = ['$scope', 'UploaderService'];

  function UploaderController($scope, UploaderService) {
    var vm = this;
    var config = $scope.config || {};

    vm.allowMultiple = config.allowMultiple || false;
    vm.uploader = UploaderService.get(config.name);

    if (config.queryUrl) {
      vm.uploader.populate(config.queryUrl);
    }

    function configUploader() {
      vm.uploader.config({
        allowMultiple: config.allowMultiple,
        fileEndpoint: config.fileEndpoint,
        urlPresigner: config.urlPresigner,
        saveParams: config.saveParams
      });
    }

    $scope.$watch('config', function(newValue) {
      config = newValue || {};
      configUploader();
    }, true);

    $scope.$watch('vm.uploader.uploading', function(newValue) {
      $scope.uploading = newValue;
    });

    $scope.$watch('vm.uploader.hasErrors', function(newValue) {
      $scope.hasErrors = newValue;
    });

  }

})();

(function () {
  'use strict';

  angular.module('ap-file-upload').directive('apFile', apFile);

  apFile.$inject = [];

  function apFile() {
    return {
      scope: {
        file: '='
      },
      controller: 'FileController as vm',
      templateUrl: 'file.html'
    }
  };

})();
(function () {
  'use strict';

  angular
    .module('ap-file-upload')
    .controller('FileController', FileController);

  FileController.$inject = ['$scope'];

  function FileController($scope) {
    var vm = this;
    vm.file = $scope.file;
  }
  
})();

angular.module("ap-file-upload").run(["$templateCache", function($templateCache) {$templateCache.put("file.html","<div ng-class=\"{\'failed\': vm.file.hasErrors}\" class=\"uploader\"><div class=\"fileName\"><span>{{vm.file.name}}</span></div><div class=\"fileActions\"><button ng-show=\"vm.file.uploading\" ng-click=\"vm.file.cancel()\" type=\"button\">Cancel</button><button ng-show=\"!vm.file.uploading\" ng-click=\"vm.file.remove()\" type=\"button\">Remove</button><button ng-show=\"vm.file.hasErrors\" ng-click=\"vm.file.retry()\" type=\"button\">Retry</button><p ng-show=\"vm.file.hasErrors\">Upload Failed</p><progress ng-show=\"vm.file.uploading\" value=\"{{vm.file.progress}}\" max=\"100\">{{vm.file.progress}}%</progress></div></div>");
$templateCache.put("uploader.html","<div class=\"uploaderWrapper\"><input ng-if=\"vm.allowMultiple\" multiple=\"\" type=\"file\" on-file-change=\"vm.uploader.add(fileList)\"/><input ng-if=\"!vm.allowMultiple\" type=\"file\" on-file-change=\"vm.uploader.add(fileList)\"/><ul class=\"uploaderFiles\"><li ng-repeat=\"file in vm.uploader.files\"><ap-file file=\"file\"></ap-file></li></ul></div>");}]);