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

    function getUploader(options) {
      if (uploaderRegistry[options.name]) {
        return uploaderRegistry[options.name];
      } else {
        var uploader = new Uploader(options);
        uploaderRegistry[options.name] = uploader;
        return uploader;
      }
    }

    function Uploader(options) {
      options = options || {};

      this.files = [];
      this.uploading = null;
      this.hasError = null;
      this.allowMultiple = options.allowMultiple || false;
      this.allowDuplicates = options.allowDuplicates || false;
      this.$fileResource = $resource(options.fileEndpoint);
      this.$presignResource = $resource(options.urlPresigner);
      this.saveParams = options.saveParams || {};

      if (options.queryUrl) {
        this._populate(options.queryUrl);
      }
    }

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
      console.log('UPDATE')
      for (var i = 0; i < uploader.files.length; i++) {
        if (uploader.files[i].uploading) {
          uploader.uploading = true;
          return;
        } else if (uploader.files[i].hasErrors) {
          uploader.hasErrors = true;
          return;
        }
      }
      uploader.uploading = false;
      uploader.hasErrors = false;
    };

    Uploader.prototype._add = function(file, options) {
      options = options || {};
      var deferred = $q.defer();
      var uploader = this;

      // TODO: Prompt user to confirm replacing file
      var replace = true;
      var dupePosition = uploader._indexOfFilename(file.name);
      var dupe = dupePosition >= 0;

      if (dupe) {
        if (replace) {
          uploader.files[dupePosition].remove().then(function() {
            uploader.files[dupePosition] = uploader._newFile(file, options);
          });
        } else {
          deferred.reject('DUPE');
        }
      } else {
        if (uploader.allowMultiple) {
          uploader.files.push(uploader._newFile(file, options));
        } else {
          if (uploader.files[0]) {
            uploader.files[0].remove().then(function() {
              uploader.files[0] = uploader._newFile(file, options);
            });
          } else {
            uploader.files[0] = uploader._newFile(file, options);
          }
        }
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

      if (file.newFile) {
        file._upload();
      } else {
        file.fileId = options.fileId;
        file.uploading = false;
        file.hasErrors = false;
      }

      return file;
    }

    //
    // Public methods
    //

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
    vm.allowMultiple = $scope.config.allowMultiple;

    vm.uploader = UploaderService.get({
      name: $scope.config.name,
      allowMultiple: $scope.config.allowMultiple,
      fileEndpoint: $scope.config.fileEndpoint,
      queryUrl: $scope.config.queryUrl,
      urlPresigner: $scope.config.urlPresigner,
      saveParams: $scope.config.saveParams,
    });

    $scope.$watch('vm.uploader.uploading', function(newValue) {
      if (newValue) {
        console.log('new uploading', newValue)
        $scope.uploading = newValue;
      }
    })

    $scope.$watch('vm.uploader.hasErrors', function(newValue) {
      if (newValue) {
        console.log('new hasError', newValue)
        $scope.hasErrors = newValue;
      }
    })
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

angular.module("ap-file-upload").run(["$templateCache", function($templateCache) {$templateCache.put("file.html","<div ng-class=\"{\'failed\': vm.file.hasErrors}\"><span>{{vm.file.name}}</span><button ng-show=\"vm.file.uploading\" ng-click=\"vm.file.cancel()\">Cancel</button><button ng-show=\"!vm.file.uploading\" ng-click=\"vm.file.remove()\">Remove</button><button ng-show=\"vm.file.hasErrors\" ng-click=\"vm.file.retry()\">Retry</button><p ng-show=\"vm.file.hasErrors\">Upload Failed</p><progress ng-show=\"vm.file.uploading\" value=\"{{vm.file.progress}}\" max=\"100\">{{vm.file.progress}}%</progress></div>");
$templateCache.put("uploader.html","<div class=\"wrapper\"><input ng-if=\"vm.allowMultiple\" multiple=\"\" type=\"file\" on-file-change=\"vm.uploader.add(fileList)\"/><input ng-if=\"!vm.allowMultiple\" type=\"file\" on-file-change=\"vm.uploader.add(fileList)\"/><ul><li ng-repeat=\"file in vm.uploader.files\"><ap-file file=\"file\"></ap-file></li></ul></div>");}]);