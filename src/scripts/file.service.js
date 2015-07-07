(function () {
  'use strict';

  angular
    .module('ap-file-upload')
    .factory('File', File);

  File.$inject = ['$q'];
  /* @ngInject */
  function File($q) {

    function File(file) {
      this.name = file.name;
      this.status = 'done';
    }

    File.prototype.retry = function() {
    }

    File.prototype.cancel = function() {
    }

    File.prototype.remove = function() {
    }

    return File;

  }
})();
