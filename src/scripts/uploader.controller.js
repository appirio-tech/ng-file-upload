(function () {
  'use strict';

  angular
    .module('ap-file-upload')
    .controller('UploaderController', UploaderController);

  UploaderController.$inject = ['$scope', 'Uploader'];

  function UploaderController($scope, Uploader) {
    var vm = this;

    vm.uploader = new Uploader({
    });

    // TODO: Remove mock files
    vm.uploader.add([
      { name: 'one.jpg' },
      { name: 'two.jpg' },
      { name: 'three.jpg' }
    ])

  }
  
})();
