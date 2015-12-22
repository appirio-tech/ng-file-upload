require.context './styles/', true, /^(.*\.(scss$))[^.]*$/igm

require 'appirio-tech-ng-ui-components'
require 'appirio-tech-ng-auth'
require './scripts/ap-file-upload.module'


require './scripts/file.controller'
require './scripts/file.directive'
require './scripts/file.service'
require './scripts/on-file-changed.directive'
require './scripts/uploaded-files.directive'
require './scripts/uploader.controller'
require './scripts/uploader.directive'
require './scripts/uploader.service'


views     = require.context './views/', true, /^(.*\.(jade$))[^.]*$/igm
viewPaths = views.keys()

templateCache = ($templateCache) ->
  for viewPath in viewPaths
    viewPathClean = viewPath.split('./').pop()

    # TODD: bug if .jade occurs more often than once
    viewPathCleanHtml = viewPathClean.replace '.jade', '.html'

    $templateCache.put "views/#{viewPathCleanHtml}", views(viewPath)()

templateCache.$nject = ['$templateCache']

angular.module('ap-file-upload').run templateCache

