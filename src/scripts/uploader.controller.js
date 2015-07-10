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
