const fs = require('fs-extra')
const path = require('path')


/**
 * Dynamically set Handler classes with the passed Mkto Client data
 * @param {*} param0 
 */
const MktoManager = function ({
    mktoBaseUrl,
    mktoClientId,
    mktoClientSecret
}) {
    /**
     * Instantiate our shared Mkto Request instance
     */
    const ApiRequest = require(path.join(__dirname, './MktoRequest')).init({
        mktoBaseUrl: mktoBaseUrl,
        mktoClientId: mktoClientId,
        mktoClientSecret: mktoClientSecret
    });

    let manager = {
        assets: {},
        usage: null
    }

    /**
     * Retrieve our BaseAsset and share the MktoRequest (ApiRequest) with it
     * Then use the newly instantiated BaseAsset as our prototype for loaded Asset Handlers
     */
    const MyBaseAsset = require(path.join(__dirname, './BaseAsset')).init(ApiRequest);

    //  Collect the assets
    const assetsPath = path.join(__dirname, './assets')
    const assetClassSpawns = fs.readdirSync(assetsPath)

    //  Iterate over the collected Asset Class Spawns and spawn each class handler with our recently configured MyBaseAsset instance
    if (assetClassSpawns) {
        assetClassSpawns.forEach(handler => {
            //  Ignore the Mixins folder
            if (handler != 'mixins') {
                let handlerName = handler.replace('.js', '')
                let Handler = require(path.join(assetsPath, handler))

                //  Store the Handler to the MktoManager Object
                manager.assets[handlerName] = Handler(MyBaseAsset)
            }
        })
    }


    /**
     * Retrieve our Usage Handler
     */
    const Usage = require(path.join(__dirname, './Usage.js')).init(ApiRequest)
    manager.usage = Usage


    /**
     * TODO - Enter Lead Loader here
     */
    //////////////////////////////////////
    //////////////////////////////////////
    //////////////////////////////////////


    return manager
}

module.exports = MktoManager