'use strict'

FileExampleController = ($scope) ->
  vm = this

  activate = ->
    vm.fileA =
      uploading: true
      progress: 50
      data:
        name: 'alex.jpg'
        caption: 'is awesome!'

    vm.fileB =
      uploading: false
      progress: 100
      data:
        name: 'samin.jpg'
        caption: 'is awesome!'

    vm.fileC =
      uploading: false
      progress: 100
      hasErrors: true
      data:
        name: 'andrew.jpg'
        caption: 'is awesome!'

    vm

  activate()

FileExampleController.$inject = ['$scope']

angular.module('example').controller 'FileExampleController', FileExampleController