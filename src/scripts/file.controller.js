(function () {
  'use strict';

  angular
    .module('ap-file-upload')
    .controller('FileController', FileController);

  FileController.$inject = ['$scope'];

  function FileController($scope) {
    var vm = this;
    vm.file = $scope.file;
    vm.captionsAllowed = $scope.file.captionsAllowed;
    vm.caption = '';

    vm.addCaption = function () {
      if (vm.caption.length) {
        vm.file.onEditCaption(vm.caption);
        vm.caption = '';
      }
    }
  }

})();
