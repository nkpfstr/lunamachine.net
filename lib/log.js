'use strict'

// Import dependencies
const chalk = require('chalk')

module.exports = {
  info (message) {
    console.log(message)
  },
  warning (message) {
    console.log(chalk.yellow(message))
  },
  error (message) {
    console.log(chalk.red(message))
  },
  success (message) {
    console.log(chalk.green(message))
  }
}
