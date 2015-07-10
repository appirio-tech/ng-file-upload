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