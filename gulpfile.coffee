configs =
  __dirname : __dirname

configs.templateCache = []
configs.templateCache.push
  files : [
    '.tmp/views/**/*.html'
  ]
  root  : ''
  module: 'ap-file-upload'

configs.fixture =
  files: 'bower_components/appirio-tech-api-schemas/**/*.json'

configs.useref =
  searchPath: ['.tmp', 'src', '.']

### END CONFIG ###
loadTasksModule = require __dirname + '/node_modules/appirio-gulp-tasks/load-tasks.coffee'

loadTasksModule.loadTasks configs