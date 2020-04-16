const BaseAsset = require('../BaseAsset').BaseAsset

const yup = require('yup')

const SpawnEmail = (ParentClass = BaseAsset) => {
    class Email extends ParentClass {
        static get endpoint() {
            return 'email'
        }

        static async find(searchParams) {
            return await super.find(Email.endpoint, searchParams)
        }

        constructor(data) {
            super(data)

            this._protectedProps = [
                //  TODO: Update this
                ...this._protectedProps,
                'template',
                'workspace',
                'status',
                'URL',
                'computedUrl',
            ]

            //////////////////////
            //  Indv. Asset Props
        }


        /**
         * Email Update method
         * 
         * Due to Marketo's interseting choice of splitting Email Metadata updates to two separate endpoints, 
         * this method will need to check changedData for certain props and fire TWO Post requests
         */
        async update() {
            //  Run the method to check for an send update request for the Email Metadata
            let metaDataResponse = await this._updateMetaData()
            let contentResponse = await this._updateContentData()

            //  Return the boolean response of both
            let returnData = {
                status: (metaDataResponse && contentResponse) ? 200 : 666,
                success: (metaDataResponse && contentResponse) ? true : false,
                errors: [
                    ...(metaDataResponse.errors ? metaDataResponse.errors : []), 
                    ...(contentResponse.errors ? contentResponse.errors : []), 
                ],
                warnings: [
                    ...(metaDataResponse.warnings ? metaDataResponse.warnings : []),
                    ...(contentResponse.warnings ? contentResponse.warnings : []),
                ],

                metaDataResponse: metaDataResponse,
                contentResponse: contentResponse,
            }
            
            return returnData
            
            
            //  The self updates are taken care of upon successfull response of each API request
            //return (Boolean(metaDataResponse) == true && Boolean(contentResponse) == true) //  TODO: Should this attempt to return something more?
        }

        /**
         * Semi Private Method for sending the MetaData update request to Marketo for specific this.data properties.
         * This is due to Marketo's split of update endpoints for the same data layer
         */
        async _updateMetaData() {
            const metaDataProps = [
                'name',
                'description',
                'operational',
                'published',
                'textOnly',
                'webView',
            ]

            return this._specialDataUpdateRequest(metaDataProps, `${this.assetEndpoint}.json`)
        }

        /**
         * Semi Private Method for sending the "Content" update request to Marketo for specific this.data properties.
         * This is due to Marketo's split of update endpoints for the same data layer
         */
        async _updateContentData() {
            const metaDataProps = [
                'fromEmail',
                'fromName',
                'replyEmail',
                'subject',
            ]

            return this._specialDataUpdateRequest(metaDataProps, `${this.assetEndpoint}/content.json`)
        }

        /**
         * Semi Private Method for sending the "Content" update request to Marketo for specific this.data properties.
         * This is due to Marketo's split of update endpoints for the same data layer
         */
        async _specialDataUpdateRequest(updateProperties, specialEndpoint) {
            //  Filter down this.changedData by matches to the above specific props
            let metaDataUpdateFound = false
            let filteredUpdateData = {}
            Object.keys(this.changedData).forEach(changedProp => {
                if (updateProperties.includes(changedProp)) {
                    filteredUpdateData[changedProp] = this.changedData[changedProp]
                    metaDataUpdateFound = true

                    //  Special Case - Because Marketo's API appears to have swappe property names
                    if(changedProp == 'replyEmail') {
                        filteredUpdateData.replyTO = this.changedData[changedProp]
                    }
                }
            })

            if (metaDataUpdateFound) {
                let requestConfig = {
                    method: 'post',
                    url: specialEndpoint,
                    params: filteredUpdateData
                }

                console.log('filteredUpdateData', filteredUpdateData)

                let response = await this.request(requestConfig)
                let updateResponse = this.makeResponse(response)

                if (updateResponse) {
                    //  Update this objects data store
                    //  We do not use the helper method cacheData() here because we are not certain 
                    //  that all changes props have been updated in Marketo, only the ones specific to this method
                    Object.keys(filteredUpdateData).forEach(changedProp => {
                        this._data[changedProp] = filteredUpdateData[changedProp]
                    })
                }

                return updateResponse
            }

            return true  //  TODO - whats a better return value here? No errors, just skipping due to no update data found for this endpoint
        }




        /**
         * Sends a sample to the emailAddress prop defined in your config param object
         * {
         *     emailAddress: '',
         *     leadId: '',
         *     textOnly: false,
         * }
         * @param {Object} config 
         */
        async sendSample(config) {
            let _defaultConfig = {
                emailAddress: '',
                //leadId: '',
                textOnly: false,
            }
            config = {
                ..._defaultConfig,
                ...config
            }

            if (!config.emailAddress) {
                return false
            }

            let requestConfig = {
                method: 'post',
                url: `${this.assetEndpoint}/sendSample.json`,
                params: config
            }

            let response = await this.request(requestConfig)

            return response
        }


        ////////////////////////////////////////
        //  Content  ///////////////////////////
        /**
         * Returns an array of all editable Content Sections
         * @param {*} params 
         */
        async getContent(params) {
            let requestConfig = {
                method: 'get',
                url: `${this.assetEndpoint}/content.json`,
                ...params
            }

            let contentResponse = await this.request(requestConfig)
            return this.makeResponse(contentResponse)
        }

        /**
         * Updates a specific Email Content Section
         * Params should match whatever was returned in the getContent request
         * @param {integer} contentId 
         * @param {Object} params 
         */
        async updateContent(contentId, params) {
            let requestConfig = {
                method: 'post',
                url: `${this.assetEndpoint}/content/${contentId}.json`,
                ...params
            }

            //  Request the fullContent
            let contentResponse = await this.request(requestConfig)
            return this.makeResponse(contentResponse)
        }


        ////////////////////////////////////////
        //  FullContent  ///////////////////////
        /**
         * Retrieves the full HTML Content of an email
         * @param {*} params 
         */
        async getFullContent(params) {
            //  Set Return Data
            let returnData = {
                status: 500,
                success: false //  DEFAULT
            }

            //  Version 2 - Endpoint for Consuming full HTML Content
            if (this.data.version == 2) {
                /*params = {
                    status: ['approved' , 'draft', ''],
                    leadId: <INT>,  //  Inserts Lead Info for tokenized data
                    type: ['HTML', 'Text']  //  Default is html
                }*/
                let requestConfig = {
                    method: 'get',
                    url: `${this.assetEndpoint}/fullContent.json`,
                    ...params
                }

                //  Request the fullContent
                let response = await this.request(requestConfig)

                //  Set return data status
                returnData.status = response.status

                //  Add'l Response Data
                if (response.data) {
                    if (response.data.errors) {
                        returnData.errors = response.data.errors
                    }
                    if (response.data.warnings) {
                        returnData.warnings = response.data.warnings
                    }
                }


                if (!!response.data) {
                    returnData.success = response.data.success

                    //  Mkto Response
                    if (response.data.result) {
                        //  Result
                        if (response.data.result.length > 0) {
                            returnData.data = response.data.result[0].content
                        } else {
                            returnData.data = response.data.result
                        }

                        //  Errors and Warnings
                        if (response.data.errors) {
                            returnData.errors = response.data.errors
                        }
                        if (response.data.warnings) {
                            returnData.warnings = response.data.warnings
                        }
                    }
                }
            }
            else {
                //  Version 1.0 Email
                //  Get and Flatten Email Content Object
                let contentObjResponse = await this.getContent(params)

                //  Set return data status
                returnData.status = contentObjResponse.status

                //  Add'l Response Data
                if (contentObjResponse.data) {
                    if (contentObjResponse.data.errors) {
                        returnData.errors = contentObjResponse.data.errors
                    }
                    if (contentObjResponse.data.warnings) {
                        returnData.warnings = contentObjResponse.data.warnings
                    }
                }

                if (!!contentObjResponse.data) {
                    returnData.success = contentObjResponse.data.success

                    returnData.data = JSON.stringify(contentObjResponse.data)
                }
            }

            return returnData
        }


        
    }


    /**
     * Mixins
     */
    const draftsMixin = require('./mixins/drafts')
    const contentMixin = require('./mixins/content')
    const variablesMixin = require('./mixins/variables')
    const deleteMixin = require('./mixins/delete')
    Object.assign(Email.prototype, draftsMixin, contentMixin, variablesMixin, deleteMixin)


    /**
     * Schema definition for Folder Properties
     */
    Email.propSchema = BaseAsset.propSchema.shape({
        subject: yup.object({
            type: yup.string().nullable(),
            value: yup.string().nullable()
        }),
        fromName: yup.object({
            type: yup.string().nullable(),
            value: yup.string().nullable()
        }),
        fromEmail: yup.string().nullable(),
        replyEmail: yup.object({
            type: yup.string().nullable(),
            value: yup.string().email().nullable()
        }),

        operational: yup.boolean(),
        textOnly: yup.boolean(),
        publishToMSI: yup.boolean(),
        webView: yup.boolean(),
        status: yup.string().oneOf(['draft', 'approved']),
        template: yup.number().integer(),

        workspace: yup.string(),
    })

    /**
     * Extend Search Schema
     */
    Email.searchSchema = BaseAsset.searchSchema.shape({
        status: yup.string().oneOf(['approved', 'draft']),
    })

    return Email
}

module.exports = SpawnEmail;