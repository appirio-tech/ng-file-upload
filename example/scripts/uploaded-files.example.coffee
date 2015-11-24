'use strict'

UploadedFilesExampleController = ($scope) ->
  vm = this
  vm.files = []

  activate = ->
    vm.files.push
      uploading: true
      progress: 50
      data:
        name: 'alex.jpg'

    vm.files.push
      uploading: false
      progress: 100
      data:
        name: 'samin.jpg'

    vm.files.push
      uploading: false
      progress: 100
      hasErrors: true
      data:
        name: 'andrew.jpg'
        caption: 'is awesome!'

    vm

  activate()

UploadedFilesExampleController.$inject = ['$scope']

angular.module('example').controller 'UploadedFilesExampleController', UploadedFilesExampleController