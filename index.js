const fs = require('fs-extra')
const path = require('path')


/**
 * Load our MktoManager Handlers, with BaseAsset auto instantiating the MktoRequest element
 */
//require('dotenv').config()
//console.log('ENVIRO: ', process.env.ENVIRO)
//console.log('!!')

//  Mkto Config
//const config = require(path.join(__dirname, `./config/config.${process.env.ENVIRO}`))

//  MktoManager - All Handlers
const MktoManager = require(path.join(__dirname, './lib/index'))

//  Bulk Processor
const BulkProcess = require(path.join(__dirname, './lib/BulkProcess'))

module.exports = function(creds) {
    return {
        mktoManager: MktoManager(creds),
        bulkProcess: BulkProcess
    }
}