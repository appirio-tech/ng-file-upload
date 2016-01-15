'use strict'

require './UploadedFilesStyles'

React                 = require 'react'
UploadedFileContainer = require '../UploadedFile/UploadedFileContainer'

UploadedFiles = ({files}) ->
  <ul className="UploadedFiles flex wrap">
    {
      files?.map ->
        <li>
          <UploadedFileContainer/>
        </li>
    }
  </ul>

module.exports = UploadedFiles

