(function () {
  'use strict';

  angular
    .module('example-app')
    .controller('ExampleAppController', ExampleAppController);

  ExampleAppController.$inject = ['$scope', 'Uploader', 'AuthService'];

  function ExampleAppController($scope, Uploader, AuthService) {
    var vm = this;
    vm.uploaderStatus = 'pristine';

    vm.authenticated = AuthService.isAuthenticated();

    vm.login = function(formData) {
      AuthService.login({
        username: vm.username,
        password: vm.password,
        success: function() {
          vm.authenticated = AuthService.isAuthenticated();
        }
      })
    }
  }
  
})();
