configs =
  coffeeFiles     : ['src/**/*.coffee', 'example/**/*.coffee']
  jadeFiles       : ['src/**/*.jade', 'example/**/*.jade']
  scssFiles       : ['src/**/*.scss', 'example/**/*.scss']
  scssIncludePaths: require('appirio-work-styles').includePaths
  tempFolder      : '.tmp'
  appFolder       : 'src'
  exampleFolder   : 'example'
  distFolder      : 'dist'

configs.karma =
  coverage   : 'app/**/*.coffee'
  # Dont include coverage files
  coffeeFiles: [
    'tests/specs/**/*.coffee'
  ]
  files: [
    'bower_components/angular/angular.js'
    'bower_components/angular-mocks/angular-mocks.js'
    'bower_components/angular-resource/angular-resource.js'
    'bower_components/angular-ui-router/release/angular-ui-router.js'
    'bower_components/auto-config-fake-server/dist/auto-config-fake-server.js'
    'bower_components/angular-scroll/angular-scroll.js'
    'bower_components/moment/moment.js'
    'bower_components/appirio-tech-ng-auth/dist/main.js'
    'bower_components/a0-angular-storage/dist/angular-storage.js'
    'bower_components/angular-jwt/dist/angular-jwt.js'
    'bower_components/auth0.js/build/auth0.js'
    'bower_components/auth0-angular/build/auth0-angular.js'
    'tests/specs/helper.coffee'
    '.tmp/scripts/constants.js'
    'app/scripts/**/*.module.coffee'
    '.tmp/scripts/templates.js'
    'app/**/*.coffee'
    'tests/specs/**/*.coffee'
  ]

configs.fixtureFiles = [
]

configs.templateCache =
  files : [
    '.tmp/views/**/*.html'
  ]
  root  : ''
  module: 'ap-file-upload'

configs.coverageReporter =
  type: 'lcov'
  dir: 'coverage'

configs.buildFiles =
  concat:
    'main.js': [
      '.tmp/scripts/templates.js',
      'src/**/*.js',
    ]
    'main.css': [
      '.tmp/styles/**/*.css'
    ]

##
## Normally, you wouldnt need to edit below this line ##
##

gulpTaskPath             = './node_modules/appirio-gulp-tasks'
configs.karma.configFile = __dirname + '/' + gulpTaskPath + '/karma.conf.coffee'
configs.karma.basePath   = __dirname
pluginsPath              = gulpTaskPath + '/node_modules/gulp-load-plugins'
browserSyncPath          = gulpTaskPath + '/node_modules/browser-sync'
karmaPath                = gulpTaskPath + '/node_modules/karma'

gulpLoadPluginsOptions =
  config: __dirname + '/' + gulpTaskPath + '/package.json'

gulp          = require 'gulp'
plugins       = require pluginsPath
$             = plugins gulpLoadPluginsOptions
$.browserSync = require browserSyncPath
$.karma       = require(karmaPath).server

tasks = [
  'coffee'
  'jade'
  'scss'
  'clean'
  'serve'
  'build'
  'test'
  'ng-constant'
  'coveralls'
  'fixtures'
  'template-cache'
]

for task in tasks
  module = require(gulpTaskPath + '/tasks/' + task)
  module gulp, $, configs

gulp.task 'default', ['clean'], ->
  gulp.start 'build'