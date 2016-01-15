'use strict'

React        = require 'react'
classnames   = require 'classnames'
UploadedFile = require './UploadedFile'

onRemove = ->
  console.log 'onRemove'

UploadedFileContainer = ({id}) ->
  props =
    status        : 'uploading'
    src           : null
    isImage       : true
    progress      : 50
    fileName      : 'crochet-turtle.jpg'
    onRemove      : onRemove
    enableCaptions: true
    captions      : 'i am a capation'

  React.createElement UploadedFile, props

module.exports = UploadedFileContainer

