(function () {
  'use strict';

  angular
    .module('example')
    .controller('ExampleAppController', ExampleAppController);

  ExampleAppController.$inject = ['$scope'];

  function ExampleAppController($scope) {
    var vm = this;

    var domain = 'https://api.topcoder-dev.com';
    var workId = '1446138896308-90856fe5-cee3-4e51-95c2-f0e51a803780';
    var category = 'work';
    var assetType = 'features';

    vm.uploaderUploading = null;
    vm.uploaderHasErrors = null;

    vm.uploaderConfig = {
      name: assetType + "-uploader-" + workId,
      allowMultiple: true,
      allowCaptions: true,
      onCaptionChange: function(fileData) {
        console.log(fileData);
      },
      query: {
        url: domain + '/v3/attachments',
        params: {
          filter: "id=" + workId + "&assetType=" + assetType + "&category=" + category,
          fields: 'url'
        }
      },
      presign: {
        url: domain + '/v3/attachments/uploadurl',
        params: {
          id: workId,
          assetType: assetType,
          category: category
        }
      },
      createRecord: {
        url: domain + '/v3/attachments',
        params: {
          id: workId,
          assetType: assetType,
          category: category
        }
      },
      removeRecord: {
        url: domain + '/v3/attachments/:fileId',
        params: {
          filter: 'category=' + category
        }
      }
    };
  }
  
})();