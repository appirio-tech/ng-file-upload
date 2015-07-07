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
