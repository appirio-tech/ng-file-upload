'use strict'

UploadedFile = require './UploadedFile.cjsx'
React  = require 'react'

UploadedFileExamples = ->
  <div className="UploadedFileExamples flex column middle center light-bg">
    <h1>Default</h1>

    <UploadedFile />

    <h1>Image failed to upload</h1>

    <UploadedFile status="failed" fileName="crochet-turtle.jpg" progress="50" />

    <h1>Image is uploading at 50 progress</h1>

    <UploadedFile status="uploading" fileName="crochet-turtle.jpg" progress="50" src={require './crochet-turtle.jpg' } isImage={true} />

    <h1>Non-Image is uploading at 50 progress</h1>

    <UploadedFile status="uploading" fileName="example.txt" progress="50" isImage={false} />

    <h1>Image was uploaded, enable captions</h1>

    <UploadedFile status="uploaded" fileName="crochet-turtle.jpg" src={require './crochet-turtle.jpg' } isImage={true} enableCaptions={true} captions="I am a caption." />

    <h1>Non-Image was uploaded</h1>

    <UploadedFile status="uploaded" fileName="this is a very very very very very long na.txt" />
  </div>

module.exports = UploadedFileExamples
