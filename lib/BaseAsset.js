const path = require('path')

//  Retrieve our single shared instance of MktoRequest
//const ApiRequest = require('./MktoBase')

const MktoResponse = require(path.join(__dirname, './MktoResponse'))


const FormData = require('form-data')
// const REQUEST = require('request')
// const fs = require('fs-extra')


class BaseAsset {

    /**
     * Statics
     */
    // static get endpoint() {
    //     return 'baseAsset'
    // }

    /**
     * Static Asset GET Request. Because this method is static, we must reference the `ApiRequest` instance directly instead of the Class stored copy (this.REQ)
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
    // static async get(endpoint, searchParams) {
    //     let getResponse = await ApiRequest.getAsset(endpoint, searchParams)

    //     return new MktoResponse(getResponse, this)
    // }


    /**
     * Validation of known Properties
     * For setting new valid prop data or validating all data prior to Asset init
     * @param {*} prop 
     * @param {*} value 
     * @param {*} validationData 
     */
    // static validateProperty(prop, value, validationData) {
    //     let errors = []
    //     let success = true

    //     if (validationData.type) {
    //         if (validationData.type !== typeof value) {
    //             errors.push('Incorrect Value type for ' + prop, value)
    //             success = false
    //         }
    //     }

    //     if (validationData.min) {
    //         if (validationData.min > value) {
    //             errors.push(`${prop} value less than minimum of ${validationData.min}`)
    //             success = false
    //         }
    //     }
    //     if (validationData.max) {
    //         if (validationData.max < value) {
    //             errors.push(`${prop} value exceeds maximum of ${validationData.max}`)
    //             success = false
    //         }
    //     }


    //     if (validationData.type === String) {
    //         if (validationData.choices.length > 0) {
    //             if (!validationData.choices.indexOf(value) == -1) {
    //                 errors.push('Value not found in list of choices for ' + prop, value)
    //                 success = false
    //             }
    //         }
    //     }

    //     return [success, errors]
    // }

    /********************
     * Init **********
     ********************/
    constructor(data) {
        //  Store the ID in a top level prop for easier reference
        if (data.id) {
            this.id = data.id
        }
        //  Create a local data store and a previous instance reference to track non-committed changes
        this.data = data
        this.cacheData()

        //  Required props for create
        this._createRequiredProps = []

        //  Protected, server only properties
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

        //this.REQ = ApiRequest
    }


    /********************
     * Getters **********
     ********************/
    //  Create a computed prop for detecting non-committed changes
    get isChanged() {
        return (this._data == this.data) === false
    }

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

    get assetEndpoint() {
        //  We use Object.getPrototypeOf(this).constructor.endpoint to get a reference to the _local_ static property
        //  Otherwise, all inherited instances would still point to the `BaseAsset.endpoint` instead of their own static property
        //  Yay EcmaScript! lol
        return `/asset/v1/${Object.getPrototypeOf(this).constructor.endpoint}/${this.id}`
    }


    /********************
     * Helpers **********
     ********************/
    cacheData() {
        this._data = JSON.parse(JSON.stringify(this.data))
    }

    get(prop) {
        if (this.data[prop]) {
            return this.data[prop]
        }
        
        return false
    }

    set(prop, value) {
        if (this._protectedProps.indexOf(prop) == -1) {
            this.data[prop] = value
        }
    }

    /***********************************
     * Requesters **********************
     ***********************************/

    async buildFormData(fileStream, fileKey = 'file') {
        //  Create a FormData instance to carry our new File Content data
        let formData = new FormData();

        /* if (filePath) {
            fileStream = await fs.createReadStream(filePath)
        }
        else if (fileUrl) {
            //fileStream = await http.get(fileUrl, res => res.pipe(fs.createWriteStream(this.data.name)));
            fileStream = await REQUEST.get(fileUrl)
        } */

        if (fileStream) {
            await formData.append(fileKey, fileStream)
        }

        //  Append MetaData to the FormData object - we skip using updateData getter here as we MUST include this, even if unchanged
        await formData.append('name', this.data.name)
        //await formData.append('filename', this.data.name)
        await formData.append('folder', JSON.stringify(this.data.folder))

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
    async createFormRequestConfig(fileStream, fileName = false, fileKey = 'file') {
        //  default
        //let defaultData = { filePath: false, fileUrl: false, fileStream: false }

        //  Build the Form Data Object with our filestream and optional custom key
        let formData = await this.buildFormData(fileStream, fileKey)

        //  Verify our Request system has an Auth Token
        await this.REQ.getAuthToken()

        //  Return a full request-ready config with content-type and Auth headers set
        return {
            method: 'post',
            data: formData,
            // `headers` are custom headers to be sent
            headers: {
                'Authorization': `Bearer ${this.REQ.apiAuthToken.access_token}`,
                'content-type': `multipart/form-data; boundary=${formData._boundary}`,
                'filename': (fileName ? fileName : this.data.name),
                'name': fileKey,
            }
        }
    }

    /********************
     * Methods **********
     ********************/
    async request(requestConfig) {
        //return await ApiRequest.mktoRequest(requestConfig)
        return await this.REQ.mktoRequest(requestConfig)
    }

    async create() {

        //  TODO create validation here against this._createRequiredProps

        let requestConfig = {
            method: 'post',
            url: `${this.assetEndpoint}.json`,
            params: this.createData,  //  Omits our protected data which the server assigns, like `id` and `createdAt`
        }
        console.log('  |  Create Config', requestConfig)
        let createResponse = await this.request(requestConfig)

        if (createResponse.status === 200) {
            //  Update this objects data store
            this.cacheData()

            if (createResponse.data.result) {
                if (createResponse.data.result.id) {
                    this.id = createResponse.data.result.id
                }
            }
        }

        return createResponse
    }

    /**
     * Update the Asset using the content from the data prop
     */
    async update() {
        let requestConfig = {
            method: 'post',
            url: `${this.assetEndpoint}.json`,
            params: this.updatedData,
        }
        console.log('  |  Update Config', requestConfig)
        let updateResponse = await this.REQ.mktoRequest(requestConfig)

        if (updateResponse.status === 200) {
            //  Update this objects data store
            this.cacheData()
        }

        return updateResponse
    }
}


const init = function (ApiRequest) {

    /**
     * Statics
     */
    BaseAsset.prototype.endpoint = 'baseAsset'

    /**
     * Static Asset GET Request. Because this method is static, we must reference the `ApiRequest` instance directly instead of the Class stored copy (this.REQ)
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
    BaseAsset.find = async function(endpoint, searchParams) {
        let getResponse = await ApiRequest.getAsset(endpoint, searchParams)

        return new MktoResponse(getResponse, this)
    }


    /**
     * Validation of known Properties
     * For setting new valid prop data or validating all data prior to Asset init
     * @param {*} prop 
     * @param {*} value 
     * @param {*} validationData 
     */
    BaseAsset.validateProperty = function(prop, value, validationData) {
        let errors = []
        let success = true

        if (validationData.type) {
            if (validationData.type !== typeof value) {
                errors.push('Incorrect Value type for ' + prop, value)
                success = false
            }
        }

        if (validationData.min) {
            if (validationData.min > value) {
                errors.push(`${prop} value less than minimum of ${validationData.min}`)
                success = false
            }
        }
        if (validationData.max) {
            if (validationData.max < value) {
                errors.push(`${prop} value exceeds maximum of ${validationData.max}`)
                success = false
            }
        }


        if (validationData.type === String) {
            if (validationData.choices.length > 0) {
                if (!validationData.choices.indexOf(value) == -1) {
                    errors.push('Value not found in list of choices for ' + prop, value)
                    success = false
                }
            }
        }

        return [success, errors]
    }


    //  Proto definitions
    BaseAsset.prototype.REQ = ApiRequest

    //  Search Params
    BaseAsset.prototype._searchParams = {
        name: {
            type: 'string',
            default: null
        },
        maxReturn: {
            type: 'number',
            default: 20,
            min: 1,
            max: 200,
        },
        offset: {
            type: 'number',
            default: 0,
            min: 0,
            max: null,
        },
        folder: {
            type: 'object',
            default: null,
        }
    }

    return BaseAsset
}

module.exports = {
    init: init,
    BaseAsset: BaseAsset
}