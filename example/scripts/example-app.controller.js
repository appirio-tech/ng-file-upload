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


    var domain = 'http://api.topcoder-dev.com';
    var workId = '1437501400964-834acc5a-f1ff-472c-beb7-76cd5ea5a1c6';

    var assetType = 'brief';
    
    vm.uploaderSingleStatus = '';
    vm.uploaderSingleConfig = {
      name: 'singleUploader',
      allowMultiple: false,
      queryUrl: domain + '/v3/workrequestfiles?filter=workId%3D' + workId + '%26assetType%3D' + assetType,
      urlPresigner: domain + '/v3/workrequestfiles/uploadurl',
      fileEndpoint: domain + '/v3/workrequestfiles/:fileId?filter=workId%3D1436372805000-66d14ff5-ec15-410f-8c51-98e18e75f0fe',
      saveParams: {
        workId: workId,
        assetType: "brief"
      }
    };
    
    assetType = 'specs';
    vm.uploaderMultipleStatus = '';
    vm.uploaderMultipleConfig = {
      name: 'multipleUploader',
      allowMultiple: true,
      queryUrl: domain + '/v3/workrequestfiles?filter=workId%3D' + workId + '%26assetType%3D' + assetType,
      urlPresigner: domain + '/v3/workrequestfiles/uploadurl?filter=workId%3D' + workId + '%26assetType%3D' + assetType + '%26fileName%3D:name',
      fileEndpoint: domain + '/v3/workrequestfiles/:fileId?filter=workId%3D1436372805000-66d14ff5-ec15-410f-8c51-98e18e75f0fe',
      saveParams: {
        workId: workId,
        assetType: "specs"
      }
    };

  }
  
})();
