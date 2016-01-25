'use strict'

require './UploadedFilesStyles'

React        = require 'react'
UploadedFile = require '../UploadedFile/UploadedFile'

UploadedFiles = ({files}) ->
  <ul className="UploadedFiles flex wrap">
    {
      files?.map (file) ->
        { fileName, fileType } = file
        status                 = 'uploaded'
        status                 = 'uploading' unless file.fileId
        isImage                = fileType?.match? 'image.*'

        <li>
          <UploadedFile
            status={status}
            fileName={fileName}
            isImage={isImage}
            enableCaptions={true}
            captions={file.captions}
            />
        </li>
    }
  </ul>

module.exports = UploadedFiles

