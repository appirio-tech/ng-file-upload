'use strict'

React                         = require 'react'
{ Provider }                  = require 'react-redux'
configureStore                = require('appirio-tech-client-app-layer').default
ExampleApp                    = require '../ExampleApp/ExampleApp.cjsx'
Router                        = require '../Router/Router.cjsx'
UploadedFileExamples          = require '../UploadedFile/UploadedFileExamples.cjsx'
UploadedFilesExamples         = require '../UploadedFiles/UploadedFilesExamples.cjsx'
FileUploaderExamples          = require '../FileUploader/FileUploaderExamples.cjsx'
FileUploaderContainerExamples = require '../FileUploader/FileUploaderContainerExamples.cjsx'

{ Router, Route, Link, IndexRoute, browserHistory } = require 'react-router'

store = configureStore
  attachments:
    'mockDataInRouter.jpg':
      assetType   : 'specs'
      category    :'work'
      fileName    : 'mockDataInRouter.jpg'
      filePath    : 'some/unique/path'
      fileType    : 'image/jpeg'
      id          : 'workid'
  fileUploader:
    id       : 'workid' # has to match schemas
    assetType: 'specs' # has to match schemas
    category : 'work' # has to match schemas

component = ->
  <Provider store={store}>
    <Router history={browserHistory}>
      <Route path="/" component={ExampleApp}>
        <IndexRoute component={FileUploaderContainerExamples}/>

        <Route path="/UploadedFileExamples" component={UploadedFileExamples}/>

        <Route path="/UploadedFilesExamples" component={UploadedFilesExamples}/>

        <Route path="/FileUploaderExamples" component={FileUploaderExamples}/>
      </Route>
    </Router>
  </Provider>


module.exports = component