const path = require('path')
const yup = require('yup');
const deepEqual = require('deep-equal');
const MktoResponse = require(path.join(__dirname, '../MktoResponse'))
const FormData = require('form-data')


/**
 * Define the BaseAsset class to create base for all Asset Active Record pattern handlers
 */
class BaseAsset {

    /********************
     * Init **********
     ********************/
    constructor(data) {

        //  Store the ID in a top level prop for easier reference
        if (data.id) {
            this.id = data.id
        }
        //  Create a local data store and a previous instance reference to track non-committed changes
        this.data = JSON.parse(JSON.stringify(data))
        this.cacheData()

        //  Required props for create
        this._createRequiredProps = []  //  TODO: finish this out
        
        //  Internal Props for creating FormData if we need to spawn FormData
        this._formData = {
            name: this.get('name').toString(),
            description: this.get('description').toString(),
            folder: JSON.stringify(this.get('folder')).trim()
        }

        //  Protected, server only properties - do not allow the set method to modify
        this._protectedProps = [
            'id',
            'createdAt',
            'updatedAt',
            'url',
        ]

        /*data = {
            id: INT,
            name: STRING,
            description: STRING,
            createdAt: TIMESTAMP,
            updatedAt: TIMESTAMP,
            folder: JSON,
            workspace: STRING <Default>,
            status: STRING <approved>,
            template: INT,
            title: STRING,
            robots: STRING,
            formPrefill: BOOLEAN,
            mobileEnabled: BOOLEAN,
            URL: STRING,
            computedUrl: STRING,
        }*/

        //this.REQ = MktoRequest
    }

    ///////////////////////////////////
    //  Because we instantiate from MongoDB Documents,
    //  lets clean up some Mongo specific props that get passed here
    static init(documentData) {
        //  TODO  -this is not Library specific, should we move this to Asset modifier in the Factory?
        const mongoPropCleanup = ['_id', '__v']
        mongoPropCleanup.forEach(cleanProp => { if (typeof documentData[cleanProp] !== "undefined") delete documentData[cleanProp] })


        return new this(documentData)
    }
    ///////////////////////////////////

    /********************
     * Getters **********
     ********************/
    //  Create a computed prop for detecting non-committed changes
    get isChanged() {
        return !deepEqual(this._data, this.data)
    }

    //  Create a computed prop for displaying currently un-saved (at the API) data
    get changedData() {
        let changedData = {}
        Object.keys(this.data).forEach(dataProp => {
            if (deepEqual(this.data[dataProp], this._data[dataProp]) === false) {
                changedData[dataProp] = this.data[dataProp]
            }
        })

        return changedData
    }

    //  Determine the specific data properties that have been updated
    get updatedData() {
        let _updatedData = {}
        for (let prop in this.data) {
            if (this.data.hasOwnProperty(prop)) {
                if (JSON.stringify(this.data[prop]) != JSON.stringify(this._data[prop])) {
                    _updatedData[prop] = this.data[prop]
                }
            }
        }

        return _updatedData
    }

    //  Filter down data to depict only the properties for record creation
    get createData() {
        let _createData = {}
        for (let prop in this.data) {
            if (this.data.hasOwnProperty(prop)) {
                if (!this._protectedProps[prop]) {
                    _createData[prop] = this.data[prop]
                }
            }
        }

        return _createData
    }

    get createAssetEndpoint() {
        //  We use Object.getPrototypeOf(this).constructor.endpoint to get a reference to the _local_ static property
        //  Otherwise, all inherited instances would still point to the `BaseAsset.endpoint` instead of their own static property
        //  Yay EcmaScript! lol
        return `/rest/asset/v1/${Object.getPrototypeOf(this).constructor.endpoint}s`
    }

    //  Retrieve the unique Asset Endpoint to operate at
    get assetEndpoint() {
        //  We use Object.getPrototypeOf(this).constructor.endpoint to get a reference to the _local_ static property
        //  Otherwise, all inherited instances would still point to the `BaseAsset.endpoint` instead of their own static property
        //  Yay EcmaScript! lol
        return `/rest/asset/v1/${Object.getPrototypeOf(this).constructor.endpoint}/${this.id}`
    }


    /********************
     * Helpers **********
     ********************/
    cacheData() {
        this._data = JSON.parse(JSON.stringify(this.data))
    }

    //  Safely retrieve a data property
    get(prop) {
        return (typeof this.data[prop] != "undefined") ? this.data[prop] : false
    }

    //  Safely set a new data property value
    set(prop, value) {
        if (this._protectedProps.indexOf(prop) == -1) {
            this.data[prop] = value
        }
    }

    //  Spawn a Mkto Response Object from the response
    makeResponse(resp, InitType = undefined) {
        return new MktoResponse(resp, InitType)
    }


    /********************
     * Methods **********
     ********************/
    async buildFormData(fileStream = false, fileName = false, fileKey = false) {
        //  Create a FormData instance to carry our new File Content data
        let formData = new FormData();

        if (!!fileStream) {
            //  TODO: Review filekey and filename properties here, may differ from LandingPageTemplate to File to EmailTemplate, etc
            await formData.append('content', fileStream, {
                filename: this.get('name') + '.html',
                contentType: 'text/plain'
            })
        }

        await Promise.all(Object.keys(this._formData).map(configKey => {
                return formData.append(configKey, this._formData[configKey])
            })
        )

        return formData
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
    async createFormRequestConfig(fileStream = false, fileName = 'content', fileKey = 'content') {
        //  Build the Form Data Object with our filestream and optional custom key
        let formData = await this.buildFormData(fileStream, fileName, fileKey)

        //  Verify our Request system has an Auth Token
        await this.REQ.getAuthToken()

        //  Return a full request-ready config with content-type and Auth headers set
        return {
            method: 'post',
            data: formData,
            // `headers` are custom headers to be sent
            headers: {
                'Accept': `application/json`,
                'Authorization': `Bearer ${this.REQ.apiAuthToken.access_token}`,
                ...formData.getHeaders(),
            }
        }
    }

    /***********************************
     * Requesters **********************
     ***********************************/
    //  Send a HTTP Request with full custom request Config
    async request(requestConfig) {
        return await this.REQ.mktoRequest(requestConfig)
    }

    //  Method for sending Create requests to the API
    //  TODO - Finish and test this system!
    async create() {
        //  TODO create validation here against this._createRequiredProps

        let requestConfig = {
            method: 'post',
            url: `${this.createAssetEndpoint}.json`,
            params: this.createData,  //  Omits our protected data which the server assigns, like `id` and `createdAt`
        }
        console.log('  |  Create Config', requestConfig)
        let response = await this.request(requestConfig)

        let createResponse = new MktoResponse(response, this)

        //  In code logic, use toBoolean against the returned createResponse to check if the create request was successfull, 
        //  and the use the MktoREsponse helper method `response.getFirst()` to retrieve the new instantiated version of this Asset
        //  that will contain all data from Marketo

        //  Return the createResponse
        return createResponse
    }

    /**
     * Update the Asset using the content from the data prop
     */
    async update() {
        let requestConfig = {
            method: 'post',
            url: `${this.assetEndpoint}.json`,
            params: this.changedData,
        }
        //console.log('  |  Update Config', requestConfig)
        let response = await this.request(requestConfig)
        let updateResponse = new MktoResponse(response, this)

        if (updateResponse) {
            //  Update this objects data store
            this.cacheData()
        }

        return updateResponse
    }

    //  Validate against a locally stored schema by schema prop name
    static async checkSchema(schema, value) {
        if (!schema) return false

        return await schema.validate(value)
    }
}



/**
 * Initialization Handler
 * Use this method to instantiate BaseAsset with a previously instantiated instance of MktoRequest
 * @param {MktoRequest} mtoReq
 */
const createBase = function (mtoReq) {

    /**
     * Constants
     */
    //  Define the API Version "id" for specifically the Asset Endpoints.
    const AssetApiVersion = 'v1'
    //BaseAsset.prototype.AssetApiVersion = 'v1'

    /**
     * Proto definitions
     */
    //  Static - Define our endpoint default. 
    //  This gets redefined for each class that extends this instance of BaseAsset
    BaseAsset.prototype.endpoint = 'baseAsset'

    //  Store a local reference to the instantiated MktoRequest (mtoReq) instance for BaseAsset+ additional Active Record pattern methods
    BaseAsset.prototype.REQ = mtoReq

    /**
     * Static Asset GET Request. Because this method is static, we must reference the `MktoRequest` mtoReq instance directly instead of the Class stored copy (this.REQ)
     * 
     * This method takes in searchParams, and will auto generate the necessary Asset specific endpoint.
     * Returned data is validated and returned as a MktoResponse instance.
     * The MktoResponse class is passed the current Class (this) to instantiate all API results as Assets.
     * 
     * ## Example:
     * _LandingPage extends BaseAsset_
     * 
     * let lpSearch = LandingPage.get({ name: 'ToasterOvenLandingPage' })
     * let toasterOvenLp = lpSearch.getFirst()
     * 
     * (toasterOvenLp instanceof LandingPage) === true!
     * 
     * 
     * @param {*} endpoint 
     * @param {*} searchParams
     */
    BaseAsset.find = async function (endpoint, searchParams) {
        //  Build Asset URI with our known prepend
        let url = mtoReq.createSearchParams(`/rest/asset/${AssetApiVersion}/${endpoint}`, searchParams)
        console.log('url', url)
        //  DEV NOTE: Marketo does not define ALL REST endpoints at /rest/*, so we need to define it on a "case by case" basis. Bad dev decisions, IMO.
        let requestConfig = {
            method: 'get',
            url: url,
            params: searchParams
        }
        let response = await mtoReq.mktoRequest(requestConfig).catch(error => console.log('MktoRequest error', error));  //  TODO - update this error handling here

        return new MktoResponse(response, this)

        /* Example Axios.data response = {
            status: 200,
            statusText: 'OK',
            data: {
                success: true,
                errors: [],  //  If success === false
                requestId: '10feb#16e26d4997c',
                warnings: [],
                result: [  //  If success === true
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object]
                ]
            }
        }*/
    }

    /**
     * Retrieve a Marketo Asset
     * @param {*} assetUri
     * @param {*} searchParams
     */
    BaseAsset.getAsset = async function (assetUri, searchParams = {}) {

    }


    /**
     * Schema definition for Global Asset Properties - TODO - Finish this
     */
    BaseAsset.propSchema = yup.object().shape({
        id: yup.number().integer()
            .required('ID is required'),
        name: yup.string()
            .required(),

        url: yup.string().url().nullable(),
        folder: yup.object({
            id: yup.number().integer(),
            type: yup.string().oneOf(['Folder', 'Program']),
        }),
        //  TODO - Correct this incorrect date validation
        // createdAt: yup.date().default(function () {
        //     return new Date();
        // }),
        // updatedAt: yup.date().default(function () {
        //     return new Date();
        // }),
    })

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
            type: yup.string().oneOf(['Folder', 'Program']),
        }),
        workspace: yup.string(),
    })

    return BaseAsset
}

module.exports = {
    createBase,
    BaseAsset
}