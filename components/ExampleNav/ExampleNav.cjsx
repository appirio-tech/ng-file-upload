'use strict'

require './ExampleNav.scss'

React      = require 'react'
classNames = require 'classnames'

{ Link } = require 'react-router'

component = ({data, state}) ->
  <ul className="ExampleNav">
    <li>
      <Link to="/">UploadedFile</Link>
    </li>
  </ul>

module.exports = component