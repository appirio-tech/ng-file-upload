'use strict'

require './UploadedFile.scss'

React      = require 'react'
classnames = require 'classnames'

UploadedFile = ({status, src, isImage, progress, fileName, onRemove, enableCaptions, captions}) ->
  <div className="UploadedFile">
    <main className="flex column middle center" >
      {
        if status == 'failed'
          <div className="failed flex column center">
            <img className="icon" src={require './icon-alert-red.svg'}/>

            <button className="clean" onClick="" type="button">
              retry
            </button>
          </div>
        else
          if isImage
            <div className="preview" style={backgroundImage: "url(#{src})"} />
          else
            <img className="document-icon" src={require './icon-document.svg'} />
      }
      {
        if status == 'uploading'
          <div className="progress">
            <progress value={progress}" max="100">
              {progress}%
            </progress>
          </div>
      }
    </main>

    <div className="file-name flex space-between">
      <p className="file-name">{ fileName }</p>
      {
        unless status == 'uploading'
          <button className="clean" type="button">
            <div className="icon cross"/>
          </button>
      }
    </div>

    {
      if enableCaptions
        <textarea placeholder="enter a caption" value={captions} />
    }
  </div>

module.exports = UploadedFile


# .uploader(ng-class="{'failed': vm.file.hasErrors}")
#   main.flex.column.middle.center(ng-class="{ end: vm.file.uploading}")
#     .fitted(
#       ng-if="!vm.file.hasErrors"
#       style="background-image: url({{ vm.src }})"
#       ng-class="{ img: vm.isImage, icon: !vm.isImage }"
#     )

#     .progress-house(ng-show="vm.file.uploading")
#       //- button(ng-show="vm.file.uploading" ng-click="vm.file.cancel()" type="button") Cancel

#       progress(value="{{vm.progress}}" max="100") {{ vm.progress }}%

#     .failed(ng-show="vm.file.hasErrors").flex.column.center
#       img.icon(ng-src=require("../images/icon-alert-red.svg"))

#       button.clean(ng-click="vm.file.retry()" type="button") retry


#   footer.flex.space-between
#     p.file-name {{ vm.file.data.name }}

#     button.clean(ng-show="!vm.file.uploading" ng-click="vm.file.remove()" type="button")
#       .icon.cross

#   textarea(
#     ng-if="vm.allowCaptions"
#     ng-model="vm.caption"
#     ng-blur="vm.setCaption()"
#     placeholder="enter a caption"
#   )
