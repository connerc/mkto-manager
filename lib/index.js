const Emitter = require("component-emitter");

const { createContainer, asClass, asFunction, asValue, aliasTo, listModules, InjectionMode } = require("awilix");

const BulkProcess = require("./BulkProcess");
const MktoRequest = require("./MktoRequest");
const MktoResponse = require("./MktoResponse");
const makeBaseMkto = require("./BaseMkto");
const makeBaseAsset = require("./assets/BaseAsset");
const makeUsage = require("./Usage");
const makeUser = require("./User");

/**
 * Create a IoC container
 */
module.exports = function ({ mktoBaseUrl, mktoClientId, mktoClientSecret }) {
    //  Define the API Version "id" for specifically the Asset Endpoints.
    const AssetApiVersion = "v1";

    const container = createContainer();

    /**
     * Register our Library Services
     */
    container.register({
        //  Mkto Credentials
        mktoBaseUrl: asValue(mktoBaseUrl),
        mktoClientId: asValue(mktoClientId),
        mktoClientSecret: asValue(mktoClientSecret),

        //  Basic Deps
        AssetApiVersion: asValue(AssetApiVersion),
        Emitter: asValue(Emitter),
        BulkProcess: asValue(BulkProcess),

        //  App Services
        mktoRequest: asClass(MktoRequest).singleton(),
        MktoResponse: asValue(MktoResponse),
        BaseMkto: asFunction(makeBaseMkto).singleton(),
        BaseAsset: asFunction(makeBaseAsset).singleton(),
        Usage: asFunction(makeUsage),
        User: asFunction(makeUser),
    });

    //  Handler container simple wrapper
    class mktoManager {
        constructor(container) {
            this._container = container;
            //  Load Asset Handlers as ScopedContainer instance under the assets prop, ignore BaseAsset
            this.loader("assets", "lib/assets/!(BaseAsset)*.js");
        }

        get BulkProcess() {
            return this._container.resolve("BulkProcess");
        }

        get Usage() {
            return this._container.resolve("Usage");
        }

        get User() {
            return this._container.resolve("User");
        }

        /**
         * Load a collection of modules into a ScopedContainer instance under a single property name
         * @param {String} collectionName
         * @param {String} globPattern
         */
        loader(collectionName, globPattern) {
            const collScope = collectionName + "Scope";

            //  Module Handler Loading
            this[collectionName] = {};
            this[collScope] = this._container.createScope();
            this[collScope].loadModules([[globPattern]], {
                resolverOptions: {
                    register: asFunction,
                    injectionMode: InjectionMode.CLASSIC,
                },
            });
            listModules([globPattern])
                .map(moduleName => moduleName.name)
                .forEach(assetName => {
                    Object.defineProperty(this[collectionName], assetName, {
                        get: () => {
                            return this[collScope].resolve(assetName);
                        },
                    });
                });
        }
    }

    return new mktoManager(container);
};
