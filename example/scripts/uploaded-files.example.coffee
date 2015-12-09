'use strict'

UploadedFilesExampleController = ($scope) ->
  vm = this
  vm.files = []

  activate = ->
    vm.files.push
      uploading: false
      progress: 100
      allowCaptions: true
      data:
        name: 'samin.jpg'
        caption: ''
        type: 'image/jpg'

    for i in [0..5]
      vm.files.push
        uploading: true
        progress: 50
        data:
          name: 'alex.jpg'
          type: 'image/jpg'

    vm.files.push
      uploading: false
      progress: 100
      hasErrors: true
      allowCaptions: true
      data:
        name: 'andrew.jpg'
        caption: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
        type: 'image/jpg'

    vm

  activate()

UploadedFilesExampleController.$inject = ['$scope']

angular.module('example').controller 'UploadedFilesExampleController', UploadedFilesExampleController