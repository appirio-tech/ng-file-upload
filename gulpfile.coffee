configs =
  __dirname : __dirname

configs.templateCache = []

configs.templateCache.push
  fileName: 'templates.js'
  files : ['.tmp/views/*.directive.html']
  root  : 'views/'
  module: 'ap-file-upload'

configs.templateCache.push
  fileName: 'example-templates.js'
  files : ['.tmp/views/*.example.html']
  root  : 'views/'
  module: 'example'

### END CONFIG ###
loadTasksModule = require __dirname + '/node_modules/appirio-gulp-tasks/load-tasks.coffee'

loadTasksModule.loadTasks configs
