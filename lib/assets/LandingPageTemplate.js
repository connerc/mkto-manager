const path = require('path')
const BaseAsset = require(path.join(__dirname, 'BaseAsset')).BaseAsset
const yup = require('yup')

const Spawn = (ParentClass = BaseAsset) => {
    class LandingPageTemplate extends ParentClass {

        static get endpoint() {
            return 'landingPageTemplate'
        }

        static async find(searchParams) {
            return await super.find(LandingPageTemplate.endpoint, searchParams)
        }

        constructor(data = {}) {
            super(data)

            this._createRequiredProps = [
                ...this._createRequiredProps,
                'name',
                'template',
                'folder',
            ]

            this._protectedProps = [
                ...this._protectedProps,
                'template',
                'workspace',
                'status',
                'createdAt',
                'updatedAt',
                'URL',
                'computedUrl',
            ]

            this._formData = {
                name: this.get('name').toString(),
                description: this.get('description'),
                folder: JSON.stringify(this.get('folder')).trim(),
                insertOnly: "true",
                templateType: this.get('templateType')
            }

            /**
             * Landing Page Search Params and their validation data
             */
            let params = {
                id: {
                    type: 'number',
                },
                name: {
                    type: 'string'
                },
                status: {
                    type: 'string',
                    default: '',
                    choices: ['approved', 'draft', '']
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

            //////////////////////
            //  Indv. Asset Props
        }

        /********************
         * Methods **********
         ********************/
        async create() {
            //  Get this instances FormData - processes pre-defined local props
            let contentFormDataRequestConfig = await this.createFormRequestConfig()

            //  Verify our Request system has an Auth Token
            await this.REQ.getAuthToken()

            //  Merge our formData Request with the URL for content update endpoint
            let requestConfig = {
                method: 'post',
                url: `${this.createAssetEndpoint}.json`,
                ...contentFormDataRequestConfig,
            }

            let contentResponse = await this.request(requestConfig)
            return this.makeResponse(contentResponse, LandingPageTemplate)
        }

        ////////////////////
        /**
         * Retrieve the HTML Markup for the Template
         */
        async getContent(searchParams) {
            let requestConfig = {
                method: 'get',
                url: `${this.assetEndpoint}/content.json`,
                params: searchParams
            }

            //  status = ['', 'approved', 'draft']

            let contentResponse = await this.request(requestConfig)
            return this.makeResponse(contentResponse)
        }

        /**
         * Send formData to update the HTML Content of the template
         * @param {} param0 
         */
        async updateContent(fileStream) {
            //  Generate our form-data content type request config
            let contentFormDataRequestConfig = await this.createFormRequestConfig(fileStream)
            //console.log('contentFormDataRequestConfig', contentFormDataRequestConfig)

            //  Verify our Request system has an Auth Token
            await this.REQ.getAuthToken()


            //  Merge our formData Request with the URL for content update endpoint
            let requestConfig = {
                method: 'post',
                url: `${this.assetEndpoint}/content.json`,
                ...contentFormDataRequestConfig,
            }


            //  If this has folder data to update, trick it into running a Create request instead
            /* if (!!this.changedData['folder']) {
                //  Switch to the Create endpoint because screw logic I guess
                requestConfig.url = `/rest/asset/v1/landingPageTemplates.json`
                requestConfig
            } */

            // console.log('requestConfig', requestConfig)
            // console.log('')

            //return await this.request(requestConfig)
            let contentResponse = await this.request(requestConfig)
            return this.makeResponse(contentResponse)
        }



    }

    const clone = require('./mixins/clone')
    const drafts = require('./mixins/drafts')
    Object.assign(LandingPageTemplate.prototype, drafts, clone)

    /**
     * Schema definition for LandingPage Properties
     */
    LandingPageTemplate.propSchema = BaseAsset.propSchema.shape({
        //URL: yup.string().url().nullable(),
    })

    /**
     * Extend Search Schema
     */
    LandingPageTemplate.searchSchema = BaseAsset.searchSchema.shape({
        status: yup.string().oneOf(['approved', 'draft']),
    })

    return LandingPageTemplate
}

module.exports = Spawn
