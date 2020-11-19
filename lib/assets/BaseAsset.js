const yup = require("yup");
const deepEqual = require("deep-equal");
const FormData = require("form-data");

/**
 * Define the BaseAsset class to create base for all Asset Active Record pattern handlers
 */
module.exports = function ({ BaseMkto, AssetApiVersion, Emitter }) {
    class BaseAsset extends BaseMkto {
        /**
         * Static API Query method with smart search criteria building.
         * `createSearchParams` method will modify the Endpoint and Query String
         * to deliver the most targeted search based on the search params provided.
         * Meant to be extended by child classes.
         * @param {String} endpoint
         * @param {Object} searchParams
         */
        static async find(endpoint, searchParams) {
            return super.find(`/rest/asset/${AssetApiVersion}/${endpoint}`, searchParams);
        }

        /*
        //  Validate against a locally stored schema by schema prop name
        static async checkSchema(schema, value) {
            if (!schema) return false;

            return await schema.validate(value);
        }
        */

        /********************
         * Init **********
         ********************/
        constructor(data) {
            super(data);

            this.endpoint = "baseAsset";
        }

        /********************
         * Getters **********
         ********************/

        //  We use Object.getPrototypeOf(this).constructor.endpoint to get a reference to the _local_ static property
        //  Otherwise, all inherited instances would still point to the `BaseAsset.endpoint` instead of their own static property
        //  Yay EcmaScript! lol
        get createAssetEndpoint() {
            return `/rest/asset/${AssetApiVersion}/${Object.getPrototypeOf(this).constructor.endpoint}s`;
        }
        //  Retrieve the unique Asset Endpoint to operate at
        get assetEndpoint() {
            return `/rest/asset/${AssetApiVersion}/${Object.getPrototypeOf(this).constructor.endpoint}/${this.id}`;
        }

        /********************
         * Helpers **********
         ********************/
        //  Spawn a Mkto Response Object from the response
        makeResponse(resp, InitType = undefined) {
            return new MktoResponse(resp, InitType);
        }

        /********************
         * Methods **********
         ********************/
        async buildFormData(fileStream = false, fileName = false, fileKey = false) {
            //  Create a FormData instance to carry our new File Content data
            let formData = new FormData();

            if (!!fileStream) {
                //  TODO: Review filekey and filename properties here, may differ from LandingPageTemplate to File to EmailTemplate, etc
                await formData.append("content", fileStream, {
                    filename: this.get("name") + ".html",
                    contentType: "text/plain",
                });
            }

            await Promise.all(
                Object.keys(this._formData).map(configKey => {
                    return formData.append(configKey, this._formData[configKey]);
                })
            );

            return formData;
        }

        /**
         * Creates initial formData POST request config for Marketo form-data submission.
         * This config must also modify the traditional headers to set the new content-type and filename
         *
         * @param {*} param - Pass object with either declared filePath, fileRemoteUrl, or fileStream
         * @param {*} fileName
         *
         * returns object of Request Config
         */
        async createFormRequestConfig(fileStream = false, fileName = "content", fileKey = "content") {
            //  Build the Form Data Object with our filestream and optional custom key
            let formData = await this.buildFormData(fileStream, fileName, fileKey);

            //  Verify our Request system has an Auth Token
            await this.mktoRequest.getAuthToken();

            //  Return a full request-ready config with content-type and Auth headers set
            return {
                method: "post",
                data: formData,
                // `headers` are custom headers to be sent
                headers: {
                    Accept: `application/json`,
                    Authorization: `Bearer ${this.mktoRequest.apiAuthToken.access_token}`,
                    ...formData.getHeaders(),
                },
            };
        }

        /***********************************
         * Requesters **********************
         ***********************************/
        //  Send a HTTP Request with full custom request Config
        // async request(requestConfig) {
        //     return await this.mktoRequest.request(requestConfig);
        // }

        //  Method for sending Create requests to the API
        //  TODO - Finish and test this system!
        async create() {
            //  TODO create validation here against this._createRequiredProps

            let requestConfig = {
                method: "post",
                url: `${this.createAssetEndpoint}.json`,
                params: this.createData, //  Omits our protected data which the server assigns, like `id` and `createdAt`
            };
            const createResponse = this.makeResponse(await this.request(requestConfig), this);
            this.emit("create", createResponse, this);

            //  In code logic, use toBoolean against the returned createResponse to check if the create request was successfull,
            //  and the use the MktoREsponse helper method `response.getFirst()` to retrieve the new instantiated version of this Asset
            //  that will contain all data from Marketo

            //  Return the createResponse
            return createResponse;
        }

        /**
         * Update the Asset using the content from the data prop
         */
        async update() {
            let requestConfig = {
                method: "post",
                url: `${this.assetEndpoint}.json`,
                params: this.changedData,
            };

            const updateResponse = this.makeResponse(await this.request(requestConfig), this);

            //  Update this objects data store
            if (updateResponse) {
                this.cacheData();
            }
            this.emit("update", updateResponse, this);

            return updateResponse;
        }
    }

    /**
     * Proto definitions
     */
    //  Instantiate Emitter capabilities on the BaseAsset Class
    Emitter(BaseAsset);

    /**
     * Schema definition for Global Asset Properties - TODO - Finish this
     */
    BaseAsset.propSchema = yup.object().shape({
        id: yup.number().integer().required("ID is required"),
        name: yup.string().required(),

        url: yup.string().url().nullable(),
        folder: yup.object({
            id: yup.number().integer(),
            type: yup.string().oneOf(["Folder", "Program"]),
        }),
        //  TODO - Correct this incorrect date validation
        // createdAt: yup.date().default(function () {
        //     return new Date();
        // }),
        // updatedAt: yup.date().default(function () {
        //     return new Date();
        // }),
    });

    /**
     * Yup validation schema for our standard Search properties for Assets
     */
    BaseAsset.searchSchema = yup.object().shape({
        id: yup.number().integer(),
        name: yup.string(),
        maxReturn: yup.number().integer().min(1).max(200),
        offset: yup.number().integer().min(0),
        folder: yup.object({
            id: yup.number().integer(),
            type: yup.string().oneOf(["Folder", "Program"]),
        }),
        workspace: yup.string(),
    });

    return BaseAsset;
};
