const fs = require('fs-extra')
const path = require('path')


/**
 * Dynamically set Handler classes with the passed Mkto Client data (Env specific Creds, Prod vs Sand)
 * @param {*} param0 
 */
const MktoManagerFactory = function ({
    mktoBaseUrl,
    mktoClientId,
    mktoClientSecret
}) {
    //  Start our Manager Store for returning all functionality in the module
    let manager = {
        assets: {},
        usage: null
    }

    //  Retrieve our MktoRequest class
    const MktoRequest = require(path.join(__dirname, './MktoRequest'))

    /**
     * Instantiate our shared Mkto Request instance
     */
    const mktoReq = new MktoRequest({
        mktoBaseUrl: mktoBaseUrl,
        mktoClientId: mktoClientId,
        mktoClientSecret: mktoClientSecret
    });

    /**
     * Retrieve our BaseAsset and share the MktoRequest (mktoReq) with it
     * Then use the newly instantiated BaseAsset as our prototype for loaded Asset Handlers
     */
    const BaseAsset = require(path.join(__dirname, './BaseAsset'))
    const MyBaseAsset = BaseAsset.init(mktoReq);

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
    const Usage = require(path.join(__dirname, './Usage.js')).init(mktoReq)
    manager.usage = Usage


    /**
     * TODO - Enter Lead Loader here
     */
    //////////////////////////////////////
    //////////////////////////////////////
    //////////////////////////////////////


    return manager
}

module.exports = MktoManagerFactory