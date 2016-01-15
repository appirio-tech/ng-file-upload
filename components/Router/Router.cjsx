'use strict'

React                 = require 'react'
ExampleApp            = require '../ExampleApp/ExampleApp.cjsx'
Router                = require '../Router/Router.cjsx'
UploadedFileExamples  = require '../UploadedFile/UploadedFileExamples.cjsx'
UploadedFilesExamples = require '../UploadedFiles/UploadedFilesExamples.cjsx'
FileUploaderExamples  = require '../FileUploader/FileUploaderExamples.cjsx'

{ Router, Route, Link, IndexRoute, browserHistory } = require 'react-router'

component = ->
  <Router history={browserHistory}>
    <Route path="/" component={ExampleApp}>
      <IndexRoute component={UploadedFileExamples}/>

      <Route path="/UploadedFilesExamples" component={UploadedFilesExamples}/>

      <Route path="/FileUploaderExamples" component={FileUploaderExamples}/>
    </Route>
  </Router>

module.exports = component