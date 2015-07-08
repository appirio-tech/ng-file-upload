angular.module("ap-file-upload").run(["$templateCache", function($templateCache) {$templateCache.put("file.html","<span>{{file.name}}</span><button ng-show=\"file.status == \'failed\'\" ng-click=\"file.retry()\">Retry</button><button ng-show=\"file.status == \'progress\'\" ng-click=\"file.cancel()\">Cancel</button><button ng-show=\"file.status == \'done\'\" ng-click=\"file.remove()\">Remove</button>");
$templateCache.put("uploader.html","<div class=\"wrapper\"><input ng-if=\"vm.multiple\" multiple=\"\" type=\"file\" on-file-change=\"vm.uploader.add(fileList)\"/><input ng-if=\"!vm.multiple\" type=\"file\" on-file-change=\"vm.uploader.add(fileList)\"/><ul><li ng-repeat=\"file in vm.uploader.files\"><ap-file file=\"file\"></ap-file></li></ul></div>");}]);
(function () {
  'use strict';

  angular.module('ap-file-upload', []);

})();
(function () {
  'use strict';

  angular
    .module('ap-file-upload')
    .controller('FileController', FileController);

  FileController.$inject = ['$scope', 'Uploader'];

  function FileController($scope, Uploader) {
    var vm = this;
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
    .factory('File', File);

  File.$inject = ['$q'];
  /* @ngInject */
  function File($q) {

    function File(data, uploader, options) {
      var file = this;
      file.data = data;
      file.name = data.name;
      file.status = 'new';
      file.locked = options.locked || false;
      file.uploader = uploader;

      file._upload().then(function(){
        file.status = 'done';
      });

      console.log(file);

      return file;
    }

    File.prototype.retry = function() {
    }

    File.prototype.cancel = function() {
    }

    File.prototype.remove = function() {
      this.uploader._remove(this);
    }

    File.prototype._upload = function() {
      var deferred = $q.defer();
      this.status = 'progress';

      setTimeout(function(){
        deferred.resolve();
      }, 1000);

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

  angular
    .module('ap-file-upload')
    .controller('UploaderController', UploaderController);

  UploaderController.$inject = ['$scope', 'Uploader'];

  function UploaderController($scope, Uploader) {
    var vm = this;

    if ($scope.multiple === 'true') vm.multiple = true;
    else if ($scope.multiple === 'false') vm.multiple = false;
    else vm.multiple = true;

    console.log(vm.multiple);

    vm.uploader = new Uploader({
    });

  }
  
})();

(function () {
  'use strict';

  angular.module('ap-file-upload').directive('apUploader', apUploader);

  apUploader.$inject = [];

  function apUploader() {
    return {
      scope: {
        multiple: '@'
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
    .factory('Uploader', Uploader);

  Uploader.$inject = ['$q', 'File'];
  /* @ngInject */
  function Uploader($q, File) {

    function Uploader(options) {
      this.files = [];
      this.multi = options.multi || true;
      this.locked = options.locked || false;
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

    Uploader.prototype._add = function(file, options) {
      var deferred = $q.defer();
      var uploader = this;
      var replace = options.replace || false;
      var dupePosition = uploader._indexOfFilename(file.name); 
      var dupe = dupePosition >= 0;

      file = new File(file, uploader, {
        locked: uploader.locked
      });

      if (dupe) {
        if (replace) {
          uploader.files[dupePosition] = file;
        } else {
          deferred.reject('DUPE');
        }
      } else {
        if (uploader.multi) {
          uploader.files.push(file);
        } else {
          uploader.files[0] = file;
        }
      }

      deferred.resolve();

      return deferred.promise;
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

    Uploader.prototype._uploadFile = function(file) {
      return getSignedUploadUrl(projectId, file.name)
        .then(function(res) {
          var signedUploadUrl = res.result.content.preSignedUrlUpload;
          return uploadToSignedUrl(signedUploadUrl, file);
        });
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
