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



        async update() {
            let requestConfig = {
                method: 'post',
                url: `${this.assetEndpoint}.json`,
                params: this.updatedData
                //data: this.updatedData
            }
            let updateResponse = await this.REQ.mktoRequest(requestConfig)

            return updateResponse
        }

        /**
         * Sends a sample to the emailAddress prop defined in your config param object
         * @param {*} config 
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

            let response = await this.REQ.mktoRequest(requestConfig)

            //console.log('sendSample response', response)
            //console.log('sendSample response', response.data.errors)

            return response
        }


        ////////////////////////////////////////
        //  Content  ///////////////////////////
        async getContent(params) {
            let requestConfig = {
                method: 'get',
                url: `${this.assetEndpoint}/content.json`,
                ...params
            }

            //  Request the fullContent
            return await this.REQ.mktoRequest(requestConfig)
        }

        ////////////////////////////////////////
        //  FullContent  ///////////////////////
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
                let response = await this.REQ.mktoRequest(requestConfig)

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



        ////////////////////////////////////////
        //  Variables  /////////////////////////
        async getVariables(status = '') {
            let requestConfig = {
                method: 'get',
                url: `${this.assetEndpoint}/variables.json`,
            }

            //  status = ['', 'approved', 'draft']
            if (status) {
                requestConfig.params = {
                    status: status
                }
            }

            let variableResponse = await this.REQ.mktoRequest(requestConfig)

            console.log('variableResponse', variableResponse)
        }

        async updateVariable(variableId, value) {
            let requestConfig = {
                method: 'get',
                url: `/asset/v1/${LandingPage.endpoint()}/${this.id}/variable/${variableId}.json`,
            }

            //  value = Any Int/String I guess
            if (value) {
                requestConfig.params = {
                    value: value
                }
            }

            let variableResponse = await this.REQ.mktoRequest(requestConfig)

            console.log('variableResponse', variableResponse)
        }
    }

    const drafts = require('./mixins/drafts')
    Object.assign(Email.prototype, drafts)


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