'use strict'

config = ($stateProvider) ->
  states = {}

  states['home'] =
    url         : '/'
    templateUrl : 'views/home.example.html'

  states['file'] =
    url         : '/file'
    controller  : 'FileExampleController as vm'
    templateUrl : 'views/file.example.html'

  for key, state of states
    $stateProvider.state key, state

config.$inject = ['$stateProvider']

angular.module('example').config(config).run()


