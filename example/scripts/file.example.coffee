'use strict'

FileExampleController = ($scope) ->
  vm = this

  activate = ->
    vm.fileA =
      uploading: true
      progress: 50
      data:
        name: 'this is a very very long name aalalala alla la alex.jpg'
        type: 'image/jpg'
        caption: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
        src: 'http://i.telegraph.co.uk/multimedia/archive/02830/cat_2830677b.jpg'

    vm.fileB =
      uploading: false
      progress: 100
      allowCaptions: true
      data:
        name: 'samin.jpg'
        type: 'something/wrong'
        caption: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'

    vm.fileC =
      uploading: false
      progress: 100
      hasErrors: true
      allowCaptions: true
      data:
        name: 'andrew.jpg'
        type: 'image/jpg'
        caption: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'

    vm

  activate()

FileExampleController.$inject = ['$scope']

angular.module('example').controller 'FileExampleController', FileExampleController