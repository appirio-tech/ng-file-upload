'use strict'

React          = require 'react'
{ connect }    = require 'react-redux'
{ uploadFile } = require 'appirio-tech-client-app-layer'
classnames     = require 'classnames'
FileUploader   = require './FileUploader'

{ createClass, createElement, PropTypes } = React

mapStateToProps = (state) ->
  { id, assetType, category, requestingUploadUrl } = state?.fileUploader

  { id, assetType, category, requestingUploadUrl }

container =
  propTypes:
    id       : PropTypes.string.isRequired
    assetType: PropTypes.string.isRequired
    category : PropTypes.string.isRequired
    dispatch : PropTypes.func.isRequired

  onChange: (files) ->
    { dispatch, id, assetType, category } = this.props

    files.map (file) ->
      dispatch uploadFile({ id, assetType, category, file })

  componentWillMount: ->
    { dispatch, id, assetType, category, requestingUploadUrl } = this.props

  render: ->
    { onChange } = this

    { requestingUploadUrl } = this.props

    createElement FileUploader, { onChange, requestingUploadUrl }

module.exports = connect(mapStateToProps)(createClass(container))

