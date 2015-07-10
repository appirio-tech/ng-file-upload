(function () {
  'use strict';

  angular.module('ap-file-upload', [
    'appirio-tech-ng-auth',
    'ngResource'
  ]);

})();
(function () {
  'use strict';

  angular
    .module('ap-file-upload')
    .factory('Uploader', Uploader);

  Uploader.$inject = ['$q', 'File'];
  /* @ngInject */
  function Uploader($q, File) {

    function Uploader(options) {
      options = options || {};

      this.files = [];
      this.multi = options.multi || true;
      this.locked = options.locked || false;
      this.fileEndpoint = options.fileEndpoint || null;
      this.queryUrl = options.queryUrl || null;
      this.urlPresigner = options.urlPresigner || null;
    }

    Uploader.prototype.add = function(files, options) {
      var uploader = this;
      options = options || {};
      files = filelistToArray(files);

      // Fail if we're trying to add multiple files to a single upload
      if (files.length > 1 && uploader.multi === false) {
        deferred.reject('NOTMULTI');
      }

      return $q.all(files.map(function(file){
        return uploader._add(file, options);
      }));
    }

    Uploader.prototype.onUpdate = function() {}

    Uploader.prototype._add = function(file, options) {
      var deferred = $q.defer();
      var uploader = this;
      var replace = options.replace || false;
      var dupePosition = uploader._indexOfFilename(file.name); 
      var dupe = dupePosition >= 0;

      if (dupe) {
        if (replace) {
          uploader.files[dupePosition] = uploader._newFile(file, options);
        } else {
          deferred.reject('DUPE');
        }
      } else {
        if (uploader.multi) {
          uploader.files.push(uploader._newFile(file, options));
        } else {
          uploader.files[0] = uploader._newFile(file, options);
        }
      }

      deferred.resolve();

      return deferred.promise;
    }

    Uploader.prototype._newFile = function(file, options) {
      var uploader = this;

      var fileOptions = {
        urlPresigner: uploader.urlPresigner,
        fileEndpoint: uploader.fileEndpoint
      }

      file = new File(file, fileOptions);

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
    }

    Uploader.prototype._remove = function(file) {
      var deferred = $q.defer();
      this.files.splice(this._indexOfFilename(file.name), 1);

      deferred.resolve();
      return deferred.promise;
    }

    Uploader.prototype._indexOfFilename = function(name) {
      var uploader = this;

      for (var i = 0; i < uploader.files.length; i++) {
        if (uploader.files[i].name === name) return i;
      };

      return -1;
    }

    function filelistToArray(collection) {
      var array = [];
      for (var i = 0; i < collection.length; i++) {
        array[i] = collection[i];
      };
      return array;
    }

    return Uploader;

  }
})();

(function () {
  'use strict';

  angular
    .module('ap-file-upload')
    .factory('File', File);

  File.$inject = ['$q', '$http', '$resource'];

  function File($q, $http, $resource) {

    function File(data, options) {
      var file = this;

      file.data = data;
      file.name = data.name;
      file.locked = options.locked || false;

      var fileName = encodeURIComponent('&fileName=' + file.name);

      file.$fileResource = $resource(options.fileEndpoint + fileName);
      file.$presignResource = $resource(options.urlPresigner + fileName);

      if (!file.locked) {
        file._upload();
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
      this._deleteFileRecord()

      .then(function(){
        this.onRemove(this);
      })

      .catch(function(){
      })
    }

    File.prototype.onRemove = function() { /* noop */ }
    File.prototype.onSuccess = function() { /* noop */ }
    File.prototype.onFailure = function() { /* noop */ }

    //
    // Private methods
    //

    File.prototype._upload = function() {
      var file = this;

      file.status = 'started';
      file.progress = 0;

      file._getPresignedUrl()

      .then(function(data) {
        console.log(data);
        var preSignedUrlUpload = data.result.content.preSignedUrlUpload;
        var xhr = file._xhr = new XMLHttpRequest();
        var formData = new FormData();

        console.log(file.data);
        formData.append(file.data.name, file.data);

        xhr.upload.onprogress = file._onProgress.bind(file);
        xhr.onload = file._onLoad.bind(file);
        xhr.onerror = file._onError.bind(file);
        xhr.onabort = file._onAbort.bind(file);

        xhr.open('PUT', preSignedUrlUpload, true);
        xhr.setRequestHeader('Content-Type', 'multipart/form-data');
        xhr.send(formData);
      })

      .catch(function(data) {
        file.status = 'failed';
        file.onFailure(response);
      })
      
    };

    File.prototype._createFileRecord = function() {
      return this.$fileResource.save().$promise;
    };

    File.prototype._deleteFileRecord = function() {
      return this.$fileResource.save().$promise;
    };

    File.prototype._getPresignedUrl = function() {
      return this.$presignResource.get().$promise;
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
        multiple: '@',
        locked: '@',
        queryUrl: '@',
        fileEndpoint: '@',
        urlPresigner: '@',
        status: '='
      },
      controller: 'UploaderController as vm',
      templateUrl: 'uploader.html',
      link: function($scope, $element, $attrs) {
        $scope.status = 'yo';
      }
    }
  };

})();
(function () {
  'use strict';

  angular
    .module('ap-file-upload')
    .controller('UploaderController', UploaderController);

  UploaderController.$inject = ['$scope', 'Uploader'];

  function UploaderController($scope, Uploader) {
    var vm = this;

    if ($scope.multiple === 'true') vm.multiple = true;
    else if ($scope.multiple === 'false') vm.multiple = false;
    else vm.multiple = true;

    vm.uploader = new Uploader({
      fileEndpoint: $scope.fileEndpoint,
      queryUrl: $scope.queryUrl,
      urlPresigner: $scope.urlPresigner
    });

    vm.uploader.onUpdate = function() {
      $scope.$apply();
    }

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

  FileController.$inject = ['$scope', 'Uploader'];

  function FileController($scope, Uploader) {
    var vm = this;
    vm.file = $scope.file;
  }
  
})();

angular.module("ap-file-upload").run(["$templateCache", function($templateCache) {$templateCache.put("file.html","<div ng-class=\"vm.file.status\"><span>{{vm.file.name}}</span><button ng-show=\"vm.file.status == \'started\'\" ng-click=\"vm.file.cancel()\">Cancel</button><button ng-show=\"vm.file.status == \'succeeded\' || vm.file.status == \'failed\'\" ng-click=\"vm.file.remove()\">Remove</button><button ng-show=\"vm.file.status == \'failed\'\" ng-click=\"vm.file.retry()\">Retry</button><progress ng-show=\"vm.file.status == \'started\'\" value=\"{{vm.file.progress}}\" max=\"100\">{{vm.file.progress}}%</progress></div>");
$templateCache.put("uploader.html","<div class=\"wrapper\"><input ng-if=\"vm.multiple\" multiple=\"\" type=\"file\" on-file-change=\"vm.uploader.add(fileList)\"/><input ng-if=\"!vm.multiple\" type=\"file\" on-file-change=\"vm.uploader.add(fileList)\"/><ul><li ng-repeat=\"file in vm.uploader.files\"><ap-file file=\"file\"></ap-file></li></ul></div>");}]);