const fs = require('fs-extra')
const path = require('path')


//const assert = require('assert')
const chai = require('chai')
chai.config.includeStack = true;
const assert = chai.assert;
const expect = chai.expect;


//const testConfig = require('../config.test')
const testConfig = require('../config.sand')
//console.log('testConfig', testConfig)

const mktoManager = require('..')({
    mktoBaseUrl: testConfig.MK_ENDPOINT_URL,
    mktoClientId: testConfig.MK_API_CLIENT_ID,
    mktoClientSecret: testConfig.MK_API_CLIENT_SECRET
}).MktoManager
//console.log('mktoManager', mktoManager)

const testAssets = [
    'Email',
    // 'EmailTemplate',
    // 'File',
    // 'Folder',
    // 'Form',
    // 'LandingPage',
    // 'LandingPageTemplate',
    // 'Program',
]


//  Collect a couple records
after(async () => {
    return mktoManager.usage.getUsage().then(function (usageResult) {
        if (usageResult.data.result) {
            console.log('date', usageResult.data.result[0].date)
            console.log('total', usageResult.data.result[0].total)
            console.log('users', usageResult.data.result[0].users)
        }
        
    })
});



//  Base Asset Testing
describe('Base Asset Testing', () => {
    it('Test Bad Asset Response', async () => {
        let requestConfig = {
            method: 'get',
            url: `/asset/v1/${mktoManager.assets.Folder.endpoint}s/.json`,
        }

        return mktoManager.assets.Folder.REQ.mktoRequest(requestConfig).then(function(result) {
            //  Successful request
            assert.isTrue(result.success, 'Request successful')

            //  No Errors
            assert.isNotEmpty(result.errors, 'Has error messages')
        })
    })
    it('Test Bad HTTP Response', async () => {
        let requestConfig = {
            method: 'get',
            url: `/asset/v1/${mktoManager.assets.Folder.endpoint}s/TOASTER-OVEN.json`,
        }

        return mktoManager.assets.Folder.REQ.mktoRequest(requestConfig).then(function (result) {
            //  Successful request
            assert.isNotTrue(result.success, 'Request unsuccessful')
        })
    })
})




for (let assetName in mktoManager.assets) {
    
    if (testAssets.indexOf(assetName) > -1) {

        //console.log('assetName', assetName)

        let assetClass = mktoManager.assets[assetName]

        describe(`Asset ${assetName}`, () => {

            let exampleRecords = null

            //  Collect a couple records
            before(async () => {
                return assetClass.find().then(function(exampleResult) {
                    exampleRecords = exampleResult
                })
            });


            //  Schema Validation
            it('Create Props validation', async () => {
                return assetClass.propSchema.isValidSync({
                    id: 1234,
                    name: 'I am a name',
                    description: 'I am a description text string',
                    url: 'https://blueyonder.com',
                })
            })
            it('Search Props validation', async () => {
                //  Testing Folder Prop Schema
                return assetClass.searchSchema.isValidSync({
                    id: 1234,
                    name: 'I am a name',
                })
            })



            //  API Requests
            it('Search by browse', async () => {
                //  Testing Folder Prop Schema
                return assetClass.find({ maxReturn: 200 }).then(function (result) {
                    //console.log('result', result)
                    //  Successful request
                    assert.isTrue(result.success, 'Request successful')

                    //  No Errors
                    assert.isEmpty(result.errors, 'No error messages')

                    //  Multiple Results
                    assert.isTrue(result.data.length > 1, 'Multiple results returned')

                    //  Asset results
                    let asset = result.getFirst()
                    //  Did asset instantiate properly
                    assert.isTrue(asset instanceof assetClass, `${assetClass.name} instantiated`)

                })
            })


            //  If Asset can search by ID
            if (assetClass.searchSchema._nodes.indexOf('id') > -1) {
                it('Search by ID', async () => {
                    //  Testing Folder Prop Schema
                    return assetClass.find({ id: exampleRecords.getFirst().get('id') }).then(function (result) {
                        //console.log('result', result)

                        //  Successful request
                        assert.isTrue(result.success, 'Request successful')

                        //  No Errors
                        assert.isEmpty(result.errors, 'No error messages')

                        //  Should have a warning message
                        assert.isEmpty(result.warnings, 'Has warning message')

                        //  Result Name match
                        assert.equal(exampleRecords.getFirst().get('name'), result.getFirst().get('name'))
                    })
                })
            }

            
            //  If Asset can search by name
            if (assetClass.searchSchema._nodes.indexOf('name') > -1) {
                it('Search by name', async () => {

                    //  Testing Folder Prop Schema
                    return assetClass.find({ name: exampleRecords.getFirst().get('name') }).then(function (result) {
                        //console.log('result', result.warnings)

                        //  Successful request
                        assert.isTrue(result.success, 'Request successful')

                        //  No Errors
                        assert.isEmpty(result.errors, 'No error messages')

                        //  Should have a warning message
                        assert.isEmpty(result.warnings, 'Has warning message')

                        //  Result Name match
                        assert.equal(exampleRecords.getFirst().get('name'), result.getFirst().get('name'))
                    })
                })


                it('No Results search by name', async () => {

                    //  Testing Folder Prop Schema
                    return assetClass.find({ name: 'ZesaolkajfhdnASERasDFasdr' }).then(function (result) {
                        //console.log('result', result.warnings)

                        //  Successful request
                        assert.isTrue(result.success, 'Request successful')

                        //  No Errors
                        assert.isEmpty(result.errors, 'No error messages')

                        //  Should have a warning message
                        assert.isNotEmpty(result.warnings, 'Has warning message')

                        //  Known missing Asset Warning Message text
                        assert.equal(result.warnings[0], 'No assets found for the given search criteria.')
                    })
                })
            }
        })
    }
}



//  Handlers
// const AllCollectors = {
//     assets: fs.readdirSync(path.join(__dirname, '../lib/assets')),
//     leads: fs.readdirSync(path.join(__dirname, '../lib/assets'))
// }

// const AssetHandlers = {}
// AllCollectors.assets.forEach((assetName, index) => {
//     if (assetName.includes('.js')) {
//         let spawnReturn = require(path.join(`../lib/assets/${assetName}`))
//         if (spawnReturn) {
//             AssetHandlers[assetName] = spawnReturn()
//         }
//     }
// })
// console.log('AssetHandlers', AssetHandlers)

/*
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
//*/