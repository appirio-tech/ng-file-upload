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
      status: $scope.status,
      name: $scope.config.name,
      allowMultiple: $scope.config.allowMultiple,
      fileEndpoint: $scope.config.fileEndpoint,
      queryUrl: $scope.config.queryUrl,
      urlPresigner: $scope.config.urlPresigner,
      saveParams: $scope.config.saveParams,
    });

    // vm.status = $scope.status;

  }
  
})();
