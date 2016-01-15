'use strict'

require './FileUploaderStyles'

React                  = require 'react'
UploadedFilesContainer = require '../UploadedFiles/UploadedFilesContainer'

FileUploader = ({multiple, onFileChange}) ->
  <div>
    <UploadedFilesContainer/>

    {
      if multiple
        <input
          multiple=""
          type="file"
          on-file-changed={onFileChange}
          className="choose-files"/>
      else
        <input
          type="file"
          on-file-changed={onFileChange}
          class="choose-files"/>
    }
  </div>

module.exports = FileUploader


