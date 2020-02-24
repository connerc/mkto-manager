const BaseAsset = require('../BaseAsset').BaseAsset

const Spawn = (ParentClass = BaseAsset) => {
    class LandingPageTemplate extends ParentClass {

        static get endpoint() {
            return 'landingPageTemplate'
        }

        static async get(searchParams) {
            return await super.get(LandingPageTemplate.endpoint, searchParams)
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


        ////////////////////
        /**
         * Retrieve the HTML Markup for the Template
         */
        async getContent(status = '') {
            let requestConfig = {
                method: 'get',
                url: `/asset/v1/${LandingPageTemplate.endpoint}/${this.id}/content.json`,
            }

            //  status = ['', 'approved', 'draft']
            if (status) {
                requestConfig.params = {
                    status: status
                }
            }

            /*
            requestConfig = {
                ...<axios response data>
                data: {
                    success: true,
                    errors: [],
                    requestId: 'f5b7#16f87694c3a',
                    warnings: [],
                    result: [
                        {
                            id: 413,
                            status: 'approved',
                            content: <HTML>,
                            templateType: 'guided',
                            enableMunchkin: true
                        }
                    ]
                }
            }
            */

            return await this.REQ.mktoRequest(requestConfig)
        }

        /**
         * Send formData to update the HTML Content of the template
         * @param {} param0 
         */
        async updateContent({ filePath, fileUrl, fileStream }) {
            //  Generate our form-data content type request config
            let contentFormDataRequestConfig = this.createFormRequestConfig({ filePath, fileUrl, fileStream })

            //  Merge our formData Request with the URL for content update endpoint
            let requestConfig = {
                ...contentFormDataRequestConfig,
                url: `/asset/v1/${LandingPageTemplate.endpoint()}/${this.id}/content`,
            }

            return await this.REQ.mktoRequest(requestConfig)
        }



    }

    const clone = require('./mixins/clone')
    const drafts = require('./mixins/drafts')
    Object.assign(LandingPageTemplate.prototype, drafts, clone)

    return LandingPageTemplate
}

module.exports = Spawn