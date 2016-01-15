'use strict'

React        = require 'react'
classnames   = require 'classnames'
FileUploader = require './FileUploader'

onRemove = ->
  console.log 'onRemove'

FileUploaderContainer = ({id}) ->
  props =
    status        : 'uploading'
    src           : null
    isImage       : true
    progress      : 50
    fileName      : 'crochet-turtle.jpg'
    onRemove      : onRemove
    enableCaptions: true
    captions      : 'i am a capation'

  React.createElement FileUploader, props

module.exports = FileUploaderContainer



# vm.uploaderConfig =
#       name: assetType + '-uploader-' + workId
#       allowMultiple: true
#       allowCaptions: true
#       onCaptionChange: (fileData) ->
#         console.log fileData
#       query:
#         url: domain + '/v3/attachments'
#         params:
#           filter: 'id=' + workId + '&assetType=' + assetType + '&category=' + category
#           fields: 'url'
#       presign:
#         url: domain + '/v3/attachments/uploadurl'
#         params:
#           id: workId
#           assetType: assetType
#           category: category
#       createRecord:
#         url: domain + '/v3/attachments'
#         params:
#           id: workId
#           assetType: assetType
#           category: category
#       removeRecord:
#         url: domain + '/v3/attachments/:fileId'
#         params:
#           filter: 'category=' + category