(function () {
  'use strict';

  angular
    .module('example-app')
    .controller('ExampleAppController', ExampleAppController);

  ExampleAppController.$inject = ['$scope', 'AuthService'];

  function ExampleAppController($scope, AuthService) {
    var vm = this;

    vm.authenticated = AuthService.isAuthenticated();
    vm.login = function(formData) {
      AuthService.login({
        username: vm.username,
        password: vm.password,
        success: function() {
          vm.authenticated = AuthService.isAuthenticated();
        }
      });
    };

    var domain = 'https://api.topcoder.com';
    var workId = '1440692631409-73ccb9c7-b0ee-41bf-bef8-56d0ff8d5179';
    var category = 'work';
    var assetType = 'specs';

    vm.uploaderUploading = null;
    vm.uploaderHasErrors = null;
    vm.uploaderConfig = {
      name: 'uploader',
      allowMultiple: true,
      query: {
        url: domain + '/v3/work-files/assets',
        params: {
          filter: 'id=' + workId + '&assetType=' + assetType + '&category=' + category
        }
      },
      presign: {
        url: domain + '/v3/work-files/uploadurl',
        params: {
          id: workId,
          assetType: assetType,
          category: category
        }
      },
      createRecord: {
        url: domain + '/v3/work-files',
        params: {
          id: workId,
          assetType: assetType,
          category: category
        }
      },
      removeRecord: {
        url: domain + '/v3/work-files/:fileId',
        params: {
          filter: 'category=' + category
        }
      }
    };

  }
  
})();