(function () {
  'use strict';

  angular
    .module('ap-file-upload')
    .controller('FileController', FileController);

  FileController.$inject = ['$scope'];

  function FileController($scope) {
    var vm = this;
    vm.file = $scope.file;
    vm.allowCaptions = vm.file.allowCaptions;
    vm.caption = '';

    vm.setCaption = function () {
      if (vm.caption.length) {
        vm.file.setCaption(vm.caption);
        vm.caption = '';
      }
    }
  }

})();
