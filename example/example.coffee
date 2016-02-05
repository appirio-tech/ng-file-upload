require '../src/src.coffee'
require 'appirio-tech-api-schemas'
require './styles/main.scss'
require './scripts/example-app.module'
require './scripts/example-app.controller'
require './scripts/file.example'
require './scripts/routes'
require './scripts/uploaded-files.example'
require './scripts/uploader.example'

exampleNav = require './nav.jade'

document.getElementById('example-nav').innerHTML = exampleNav()

views = require.context './views/', true, /^(.*\.(jade$))[^.]*$/igm
viewPaths = views.keys()

templateCache = ($templateCache) ->
  for viewPath in viewPaths
    viewPathClean = viewPath.split('./').pop()

    # TODD: bug if .jade occurs more often than once
    viewPathCleanHtml = viewPathClean.replace '.jade', '.html'

    $templateCache.put "views/#{viewPathCleanHtml}", views(viewPath)()

templateCache.$nject = ['$templateCache']

angular.module('example').run templateCache
