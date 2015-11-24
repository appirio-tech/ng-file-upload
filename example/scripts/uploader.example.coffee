'use strict'

UploaderExampleController = ($scope) ->
  vm = this

  activate = ->
    domain    = 'https://api.topcoder-dev.com'
    workId    = '1446138896308-90856fe5-cee3-4e51-95c2-f0e51a803780'
    category  = 'work'
    assetType = 'features'

    vm.uploaderConfig =
      name: assetType + '-uploader-' + workId
      allowMultiple: true
      allowCaptions: true
      onCaptionChange: (fileData) ->
        console.log fileData
      query:
        url: domain + '/v3/attachments'
        params:
          filter: 'id=' + workId + '&assetType=' + assetType + '&category=' + category
          fields: 'url'
      presign:
        url: domain + '/v3/attachments/uploadurl'
        params:
          id: workId
          assetType: assetType
          category: category
      createRecord:
        url: domain + '/v3/attachments'
        params:
          id: workId
          assetType: assetType
          category: category
      removeRecord:
        url: domain + '/v3/attachments/:fileId'
        params:
          filter: 'category=' + category

    vm

  activate()

UploaderExampleController.$inject = ['$scope']

angular.module('example').controller 'UploaderExampleController', UploaderExampleController