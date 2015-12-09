(function () {
  'use strict';

  angular.module('ap-file-upload', [
    'ngResource',
    'appirio-tech-ng-ui-components'
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

    // This registry allows us to have multiple uploaders sharing this service
    // Each uploader should have a unique name
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
      this.uploading = false;
      this.hasErrors = false;
      this.hasFiles = false;
    }

    Uploader.prototype.onCaptionChange = function() { /* noop */ };

    Uploader.prototype.onUploadSuccess = function() { /* noop */ };

    Uploader.prototype.config = function(options) {
      options = options || {};

      this.allowMultiple = options.allowMultiple || false;
      this.allowDuplicates = options.allowDuplicates || false;
      this.allowCaptions = options.allowCaptions || false;

      this.presign = options.presign || null;
      this.query = options.query || null;
      this.createRecord = options.createRecord || null;
      this.removeRecord = options.removeRecord || null;

      if (options.onCaptionChange) {
        this.onCaptionChange = options.onCaptionChange;
      }

      if (options.onUploadSuccess) {
        this.onUploadSuccess = options.onUploadSuccess;
      }


      if (options.presign) {
        this.presign.resource = $resource(options.presign.url);
      }

      if (options.query) {
        this.query.resource = $resource(options.query.url);
      }

      if (options.createRecord) {
        this.createRecord.resource = $resource(options.createRecord.url);
      }

      if (options.removeRecord) {
        this.removeRecord.resource = $resource(options.removeRecord.url);
      }
    };

    Uploader.prototype.populate = function() {
      this._populate();
    };

    Uploader.prototype.add = function(files, options) {
      var uploader = this;
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
      uploader.hasFiles = uploader.files.length > 0
    };

    Uploader.prototype._add = function(fileData, options) {
      var deferred = $q.defer();
      var uploader = this;

      // TODO: Prompt user to confirm replacing file
      var replace = true;
      var dupePosition = uploader._indexOfFilename(fileData.name);
      var dupe = dupePosition >= 0;

      var newFile = uploader._newFile(fileData, options);

      if (dupe) {
        if (replace) {
          uploader.files[dupePosition].remove().then(function() {
            uploader.files[dupePosition] = newFile;
            uploader.onUpdate();
          });
        } else {
          deferred.reject('DUPE');
        }
      } else {
        if (uploader.allowMultiple) {
          uploader.files.push(newFile);
        } else {
          if (uploader.files[0]) {
            uploader.files[0].remove().then(function() {
              uploader.files[0] = newFile;
            });
          } else {
            uploader.files[0] = newFile;
          }
        }
      }

      if (newFile.newFile) {
        newFile.start();
      } else {
        uploader.onUpdate();
      }

      deferred.resolve();

      return deferred.promise;
    };

    Uploader.prototype._populate = function() {
      var uploader = this;
      var $promise = uploader.query.resource.get(uploader.query.params).$promise;

      $promise.then(function(data) {
        var files = data.result.content || [];

        files.forEach(function(file) {
          uploader._add({
            id: file.fileId,
            name: file.fileName,
            path: file.filePath,
            size: file.fileSize,
            type: file.fileType,
            url: file.preSignedURL
          }, {
            newFile: false,
          });
        });
      });
    };

    Uploader.prototype._newFile = function(file, options) {
      var uploader = this;
      options = options || {}

      options.presign = uploader.presign || null;
      options.query = uploader.query || null;
      options.createRecord = uploader.createRecord || null;
      options.removeRecord = uploader.removeRecord || null;
      options.allowCaptions = uploader.allowCaptions || false;

      file = new File(file, options);

      file.onStart = function(response) {
        uploader.onUpdate();
      };

      file.onProgress = function(response) {
        uploader.onUpdate();
      };

      file.onSuccess = function(response, filedata) {
        uploader.onUploadSuccess(filedata);
        uploader.onUpdate();
      };

      file.onFailure = function(response) {
        uploader.onUpdate();
      };

      file.onRemove = function(file) {
        uploader._remove(file);
      };

      file.onCaptionChange = function(fileData) {
        uploader.onCaptionChange(fileData)
        uploader.onUpdate();
      }

      return file;
    };

    Uploader.prototype._remove = function(file) {
      this.files.splice(this._indexOfFilename(file.data.name), 1);
      this.onUpdate();

      return $q.when(true);
    };

    Uploader.prototype._indexOfFilename = function(name) {
      var uploader = this;

      for (var i = 0; i < uploader.files.length; i++) {
        if (uploader.files[i].data.name === name) return i;
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
      options = angular.copy(options);

      file.data = data;
      file.newFile = options.newFile !== false;
      file.locked = options.locked || false;
      file.allowCaptions = options.allowCaptions || false;

      file.presign = options.presign || null;
      file.query = options.query || null;
      file.createRecord = options.createRecord || null;
      file.removeRecord = options.removeRecord || null;


      if (file.newFile) {
        getDataUrl(data).then(function(src) {
          file.data.src = src;
        })
      } else {
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

    File.prototype.setCaption = function(caption) {
      var file = this;

      file.data.caption = caption;

      file.onCaptionChange({
        caption: file.data.caption,
        id:   file.data.id,
        name: file.data.name,
        path: file.data.path,
        size: file.data.size,
        type: file.data.type
      });
    };

    File.prototype.onStart = function() { /* noop */ };
    File.prototype.onRemove = function() { /* noop */ };
    File.prototype.onProgress = function() { /* noop */ };
    File.prototype.onSuccess = function() { /* noop */ };
    File.prototype.onFailure = function() { /* noop */ };
    File.prototype.onCaptionChange = function() { /* noop */ };

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
        .then(storeFileId.bind(file))
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
      var params = this.removeRecord.params || {};
      params.fileId = this.data.id;

      return this.removeRecord.resource.delete(params).$promise;
    };

    File.prototype._getPresignedUrl = function() {
      var params = {
        param: this.presign.params || {}
      };

      params.param.fileName = this.data.name;
      params.param.fileType = this.data.type;
      params.param.fileSize = this.data.size;

      return this.presign.resource.save(params).$promise;
    };

    File.prototype._onProgress = function(e) {
      var progress = Math.round(e.lengthComputable ? e.loaded * 100 / e.total : 0);
      this.onProgress(progress);
    };

    File.prototype._failed = function(err) {
      var file = this;
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
      var file = this;

      file.data.path = content.filePath;
      return content;
    }

    function storeFileId(content) {
      var file = this;

      if (!file.createRecord) {
        file.data.id = content.fileId;
      }

      return content;
    }

    function storePresignedUrl(content) {
      var deferred = $q.defer();
      var preSignedURL = content.preSignedURL;

      if (preSignedURL) {
        this.preSignedURL = preSignedURL;
        deferred.resolve()
      } else {
        deferred.reject('Response from presigned URL request had no presigned URL');
      }

      return deferred.promise;
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
      var deferred = $q.defer();
      var status = this._xhr.status;

      if ((status >= 200 && status < 300) || status === 304) {
        deferred.resolve()
      } else {
        deferred.reject('File upload to S3 failed: ' + status);
      }

      return deferred.promise;
    }

    function transformXhrResponse() {
      var xhr = this._xhr;
      var headers = parseHeaders(xhr.getAllResponseHeaders());
      var response = xhr.response;
      var headersGetter = makeHeadersGetter(headers);

      angular.forEach($http.defaults.transformResponse, function(transformFn) {
        response = transformFn(response, headersGetter);
      });

      return response;
    }

    function createFileRecord() {
      if (this.createRecord) {
        var params = {
          param: this.createRecord.params || {}
        };

        params.param.fileName = this.data.name;
        params.param.filePath = this.data.path;
        params.param.fileType = this.data.type;
        params.param.fileSize = this.data.size;

        return this.createRecord.resource.save(params).$promise;
      } else {
        return this.data;
      }
    }

    function fileRecordSuccess(response) {
      var file = this;

      if (response.result) {
        file.data.id = response.result.content.fileId;
      } else {
        file.data.id = response.id
      }

      var filedata = {
        id: file.data.id,
        name: file.data.name,
        path: file.data.path,
        size: file.data.size,
        type: file.data.type
      }

      file.hasErrors = false;
      file.uploading = false;
      file.onSuccess(response, filedata);
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

    function makeHeadersGetter(parsedHeaders) {
      return function(name) {
        if (name) {
          return parsedHeaders[name.toLowerCase()] || null;
        }
        return parsedHeaders;
      };
    }

    function getDataUrl(fileData) {
      var deferred = $q.defer();
      var reader   = new FileReader();

      reader.onload = function(){
        deferred.resolve(reader.result);
      };

      reader.onerror = function() {
        deferred.reject();
      }

      reader.readAsDataURL(fileData);

      return deferred.promise;
    }

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
        hasFiles: '=',
        fileArray: '=',
        config: '='
      },
      controller: 'UploaderController as vm',
      templateUrl: 'views/uploader.directive.html'
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

    function configUploader(newConfig, oldConfig) {
      if (newConfig === undefined) {
        return false;
      }

      var oldName = oldConfig ? oldConfig.name : undefined;
      if (newConfig.name !== oldName) {
        vm.uploader = UploaderService.get(newConfig.name);
      }

      vm.config = newConfig;
      vm.uploader.config(vm.config);

      var oldQuery = oldConfig ? oldConfig.query : undefined;
      if (newConfig.query && newConfig.query !== oldQuery) {
        vm.uploader.populate();
      }

      if (newConfig && !oldConfig) {
        $scope.$watch('vm.uploader.uploading', function(newValue) {
          $scope.uploading = newValue;
        });

        $scope.$watch('vm.uploader.hasErrors', function(newValue) {
          $scope.hasErrors = newValue;
        });

        $scope.$watch('vm.uploader.hasFiles', function(newValue) {
          $scope.hasFiles = newValue;
        });

        $scope.$watch('vm.uploader.fileArray', function(newValue) {
          $scope.fileArray = newValue;
        });
      }
    }

    $scope.$watch('config', configUploader, true);

    configUploader($scope.config);
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
      templateUrl: 'views/file.directive.html'
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
    vm.allowCaptions = vm.file.allowCaptions;
    vm.caption = '';
    vm.progress = 0;

    var setSrc = function() {
      var src = vm.file.data.src || vm.file.data.url

      if (src && vm.file.data.type.match('image.*')) {
        vm.hasImage = true;
      }

      vm.src = src || '/images/icon-document.svg';
    }

    $scope.$watch('vm.file.data.src', setSrc);

    setSrc();

    vm.setCaption = function () {
      if (vm.caption.length) {
        vm.file.setCaption(vm.caption);
      }
    }

    vm.file.onProgress = function(progress) {
      $scope.$apply(function() {
        vm.progress = progress;
      })
    }
  }

})();

(function() {
  'use strict';
  var directive;

  directive = function() {
    return {
      restrict: 'E',
      templateUrl: 'views/uploaded-files.directive.html',
      scope: {
        files: '='
      }
    };
  };

  angular.module('ap-file-upload').directive('uploadedFiles', directive);

}).call(this);

angular.module("ap-file-upload").run(["$templateCache", function($templateCache) {$templateCache.put("views/file.directive.html","<div ng-class=\"{\'failed\': vm.file.hasErrors}\" class=uploader><main ng-class=\"{ end: vm.file.uploading}\" class=\"flex column middle center\"><div ng-if=!vm.file.hasErrors style=\"background-image: url({{ vm.src }})\" ng-class=\"{ img: vm.hasImage, icon: !vm.hasImage }\" class=fitted></div><div ng-show=vm.file.uploading class=progress-house><progress value={{vm.progress}} max=100>{{ vm.progress }}%</progress></div><div ng-show=vm.file.hasErrors class=\"failed flex column center\"><img ng-src=/images/icon-alert-red.svg class=icon><button ng-click=vm.file.retry() type=button class=clean>retry</button></div></main><footer class=\"flex space-between\"><p class=file-name>{{ vm.file.data.name }}</p><button ng-show=!vm.file.uploading ng-click=vm.file.remove() type=button class=clean><div class=\"icon cross\"></div></button></footer><textarea ng-if=vm.allowCaptions ng-model=vm.caption ng-blur=vm.setCaption() placeholder=\"enter a caption\"></textarea></div>");
$templateCache.put("views/uploaded-files.directive.html","<ul class=\"flex wrap\"><li ng-repeat=\"file in files\"><ap-file file=file></ap-file></li></ul>");
$templateCache.put("views/uploader.directive.html","<div ng-if=vm.config><uploaded-files files=vm.uploader.files ng-show=vm.uploader.files.length></uploaded-files><input ng-if=vm.config.allowMultiple multiple type=file on-file-change=vm.uploader.add(fileList) class=choose-files><input ng-if=!vm.config.allowMultiple type=file on-file-change=vm.uploader.add(fileList) class=choose-files></div>");}]);