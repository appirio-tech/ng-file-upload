'use strict'

FileUploader = require './FileUploader'
React        = require 'react'

FileUploaderExamples = ->
  <div className="FileUploaderExamples flex column middle center light-bg">
    <h1>Default</h1>

    <FileUploader/>

    <h1>multiple is true</h1>

    <FileUploader multiple={true}/>
  </div>

module.exports = FileUploaderExamples
