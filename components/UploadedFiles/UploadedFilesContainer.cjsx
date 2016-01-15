'use strict'

React         = require 'react'
classnames    = require 'classnames'
UploadedFiles = require './UploadedFiles'

UploadedFilesContainer = ({id}) ->
  props =
    files: [0..1]

  React.createElement UploadedFiles, props

module.exports = UploadedFilesContainer

