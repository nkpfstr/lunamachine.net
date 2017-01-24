'use strict'

const fs = require('fs-extra')
const log = require('./log')

module.exports = (domain, dest) => {
  let protocol = 'http://' || 'https://'
  // Strip protocol from domain name if present
  if (domain.startsWith(protocol)) {
    domain = domain.replace(/^https?:\/\//, '')
  }
  // Generate CNAME file
  return fs.outputFile(`${dest}/CNAME`, domain, error => {
    if (error) log.error(error)
  })
}
