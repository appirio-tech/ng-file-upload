(function () {
  'use strict';

  angular
    .module('ap-file-upload')
    .controller('UploaderController', UploaderController);

  UploaderController.$inject = ['$scope', 'Uploader'];

  function UploaderController($scope, Uploader) {
    var vm = this;
    vm.multiple = $scope.config.multiple;

    vm.uploader = new Uploader({
      allowMultiple: $scope.config.allowMultiple,
      fileEndpoint: $scope.config.fileEndpoint,
      queryUrl: $scope.config.queryUrl,
      urlPresigner: $scope.config.urlPresigner,
      saveParams: $scope.config.saveParams,
    });

  }
  
})();
