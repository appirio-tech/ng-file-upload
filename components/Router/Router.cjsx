'use strict'

React                = require 'react'
ExampleApp           = require '../ExampleApp/ExampleApp.cjsx'
Router               = require '../Router/Router.cjsx'
UploadedFileExamples = require '../UploadedFile/UploadedFileExamples.cjsx'

{ Router, Route, Link, IndexRoute, browserHistory } = require 'react-router'

component = ->
  <Router history={browserHistory}>
    <Route path="/" component={ExampleApp}>
      <IndexRoute component={UploadedFileExamples}/>
    </Route>
  </Router>

module.exports = component