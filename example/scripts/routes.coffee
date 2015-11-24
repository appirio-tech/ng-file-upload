'use strict'

config = ($stateProvider) ->
  states = {}

  states['home'] =
    url         : '/'
    controller  : 'UploaderExampleController as vm'
    templateUrl : 'views/home.example.html'

  states['uploaded-files'] =
    url         : '/uploaded-files'
    controller  : 'UploadedFilesExampleController as vm'
    templateUrl : 'views/uploaded-files.example.html'

  states['file'] =
    url         : '/file'
    controller  : 'FileExampleController as vm'
    templateUrl : 'views/file.example.html'

  for key, state of states
    $stateProvider.state key, state

config.$inject = ['$stateProvider']

angular.module('example').config(config).run()


