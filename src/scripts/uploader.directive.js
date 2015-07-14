(function () {
  'use strict';

  angular.module('ap-file-upload').directive('apUploader', apUploader);

  apUploader.$inject = [];

  function apUploader() {
    return {
      scope: {
        status: '=',
        config: '='
      },
      controller: 'UploaderController as vm',
      templateUrl: 'uploader.html'
    }
  };

})();