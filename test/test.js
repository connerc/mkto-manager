const fs = require('fs-extra')
const path = require('path')


const assert = require('assert')
const testConfig = require('../config.test')
console.log('testConfig', testConfig)

const mktoManager = require('..')({
    mktoBaseUrl: testConfig.MK_ENDPOINT_URL,
    mktoClientId: testConfig.MK_API_CLIENT_ID,
    mktoClientSecret: testConfig.MK_API_CLIENT_SECRET
})
console.log('mktoManager', mktoManager)


//  Handlers
const AllCollectors = {
    assets: fs.readdirSync(path.join(__dirname, '../lib/assets')),
    leads: fs.readdirSync(path.join(__dirname, '../lib/assets'))
}

const AssetHandlers = {}
AllCollectors.assets.forEach((assetName, index) => {
    if (assetName.includes('.js')) {
        let spawnReturn = require(path.join(`../lib/assets/${assetName}`))
        if (spawnReturn) {
            AssetHandlers[assetName] = spawnReturn()
        }
    }
})
console.log('AssetHandlers', AssetHandlers)


const runTest = async function () {
    describe('Asset', function () {

        for (let HandlerName in AssetHandlers) {
            if (AssetHandlers.hasOwnProperty(HandlerName)) {
                let thisHandler = AssetHandlers[HandlerName]

                if (!mktoManager.assets[thisHandler]) {
                    it(`finds a ${HandlerName} by id only`, function (done) {
                        mktoManager.assets[thisHandler].find({ id: 1 }).then(function (response) {

                            let mktoRecord = response.getFirst()

                            console.log('mktoRecord', mktoRecord)

                            // assert.equal(response.result.length, 1);
                             //assert.equal(response.result[0].id, 1);
                            // assert(_.has(response.result[0], 'email'));
                            // assert(_.has(response.result[0], 'lastName'));


                            done();

                        }).catch(done);
                    });
                }
            }
        }

        //describe('#byId', function () {

        //})
    });
}

runTest().then(function () {
    //process.exit(0)
})
