(function () {
  'use strict';

  angular
    .module('ap-file-upload')
    .controller('FileController', FileController);

  FileController.$inject = ['$scope', 'Uploader'];

  function FileController($scope, Uploader) {
    var vm = this;
    vm.file = $scope.file;
  }
  
})();
