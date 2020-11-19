const fs = require("fs");
const path = require("path");

/**
 * Retrieve our BaseAsset and share the MktoRequest (mktoReq) with it
 * Then use the newly instantiated BaseAsset as our prototype for loaded Asset Handlers
 */
const BaseMktoFactory = require(path.join(__dirname, "../", "BaseMkto"));
const MyBaseMkto = BaseMktoFactory(mktoReq);

//  Collect the assets
const assetsPath = path.join(__dirname, "./assets");
const assetClassSpawns = fs.readdirSync(assetsPath);

//  Iterate over the collected Asset Class Spawns and spawn each class handler with our recently configured MyBaseAsset instance
if (assetClassSpawns) {
    assetClassSpawns.forEach(handler => {
        //  Ignore the Mixins folder
        if (handler != "BaseAsset.js" && handler != "mixins") {
            let handlerName = handler.replace(".js", "");
            let Handler = require(path.join(assetsPath, handler));

            //  Store the Handler to the MktoManager Object
            manager.assets[handlerName] = Handler(MyBaseAsset);
        }
    });
}
