(function () {
  'use strict';

  angular
    .module('example-app')
    .controller('ExampleAppController', ExampleAppController);

  ExampleAppController.$inject = ['$scope', 'Uploader', 'AuthService'];

  function ExampleAppController($scope, Uploader, AuthService) {
    var vm = this;

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

    vm.uploaderStatus = 'pristine';

    vm.queryUrl = formatUrl({
      domain: 'http://192.168.1.126:8080/v3/',
      path: 'workrequestfiles',
      filters: {
        workRequestId: '1436372805000-66d14ff5-ec15-410f-8c51-98e18e75f0fe',
      }
    });

    vm.fileEndpoint = formatUrl({
      domain: 'http://192.168.1.126:8080/v3/',
      path: 'workrequestfiles',
      filters: {
        workRequestId: '1436372805000-66d14ff5-ec15-410f-8c51-98e18e75f0fe',
      }
    });

    vm.presignerUrl = formatUrl({
      domain: 'http://192.168.1.126:8080/v3/',
      path: 'workrequestfiles/uploadurl',
      filters: {
        workRequestId: '1436372805000-66d14ff5-ec15-410f-8c51-98e18e75f0fe',
        assetType: 'specs'
      }
    });

    function formatUrl(params) {
      var filterArray = [];
      for (var key in params.filters) {
        filterArray.push(key + '=' + params.filters[key])
      }
      var filterString = '?filter=' + encodeURIComponent(filterArray.join('&'));
      return params.domain + params.path + filterString;
    }
  }
  
})();
