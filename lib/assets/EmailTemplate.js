const fs = require('fs-extra')
const path = require('path')
const BaseAsset = require(path.join(__dirname, 'BaseAsset')).BaseAsset
const yup = require('yup')

const Spawn = (ParentClass = BaseAsset) => {
    class EmailTemplate extends ParentClass {

        static get endpoint() {
            return 'emailTemplate'
        }

        static async find(searchParams) {
            return await super.find(EmailTemplate.endpoint, searchParams)
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
        async create(filePath) {
            let fileStream = await fs.createReadStream(filePath)
            let requestConfig = await this.createFormRequestConfig(fileStream, false, 'content')

            //  Add our Request URL
            requestConfig.url = `/asset/v1/${EmailTemplate.endpoint}s.json`

            let createResponse = await this.request(requestConfig)

            return createResponse
        }


        ////////////////////
        /**
         * Retrieve the HTML Markup for the Template
         */
        async getContent(status = '') {
            let requestConfig = {
                method: 'get',
                url: `/asset/v1/${EmailTemplate.endpoint}/${this.id}/content.json`,
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
        async updateContent(filePath) {
            //  Generate our form-data content type request config
            let fileStream = await fs.createReadStream(filePath)
            let requestConfig = await this.createFormRequestConfig(fileStream, false, 'content')

            //  Add our Request URL
            requestConfig.url = `/asset/v1/${EmailTemplate.endpoint}/${this.id}/content.json`

            return await this.request(requestConfig)
        }



    }

    const clone = require('./mixins/clone')
    const drafts = require('./mixins/drafts')
    Object.assign(EmailTemplate.prototype, drafts, clone)

    /**
     * Schema definition for Folder Properties
     */
    EmailTemplate.propSchema = BaseAsset.propSchema.shape({
        status: yup.string().oneOf(['Draft', 'Approved']),
        workspace: yup.string(),
    })

    /**
     * Extend Search Schema
     */
    EmailTemplate.searchSchema = BaseAsset.searchSchema.shape({
        status: yup.string().oneOf(['approved', 'draft']),
    })

    return EmailTemplate
}

module.exports = Spawn;