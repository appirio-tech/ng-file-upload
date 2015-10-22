(function () {
  'use strict';

  angular
    .module('ap-file-upload')
    .controller('UploaderController', UploaderController);

  UploaderController.$inject = ['$scope', 'UploaderService'];

  function UploaderController($scope, UploaderService) {
    var vm = this;
    var config = $scope.config || {};

    vm.allowMultiple = config.allowMultiple || false;
    vm.uploader = UploaderService.get(config.name);

    function configUploader() {
      vm.uploader.config(config);
    }

    $scope.$watch('config', function(newValue) {
      config = newValue || {};
      configUploader();
    }, true);

    $scope.$watch('vm.uploader.uploading', function(newValue) {
      $scope.uploading = newValue;
    });

    $scope.$watch('vm.uploader.hasErrors', function(newValue) {
      $scope.hasErrors = newValue;
    });

    $scope.$watch('vm.uploader.hasFiles', function(newValue) {
      $scope.hasFiles = newValue;
    });

    configUploader();

    if (config.query) {
      vm.uploader.populate();
    }

  }

})();
