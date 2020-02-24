const BaseAsset = require('../BaseAsset').BaseAsset

//  DEV NOTE: To keep consistency, the "getContent" method here has to manually request the Public content
//  Thus, it gets it's own rate limited Axios instance
const axios = require('axios')
const rateLimit = require('axios-rate-limit')
const limitConfig = {
    maxRPS: 4
}
const requester = axios.create()
const myAxios = rateLimit(requester, limitConfig)

const Spawn = (ParentClass = BaseAsset) => {

    class LandingPage extends ParentClass {

        static get endpoint() {
            return 'landingPage'
        }

        static async get(searchParams) {
            return await super.get(LandingPage.endpoint, searchParams)
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

            

            //////////////////////
            //  Indv. Asset Props
        }

        /********************
         * Methods **********
         ********************/
        ////////////////////////////////////////
        //  FullContent  ///////////////////////
        async getFullContent() {
            if (this.get('status') == 'approved' && this.get('URL')) {
                const pageUrl = this.get('URL')
                let response = await myAxios.get(pageUrl)

                return {
                    status: response.status,
                    success: (response.status === 200),
                    data: response.data,
                    errors: [],
                    warnings: []
                }
            }
            else {
                return false
            }
        }

        ////////////////////

        async getVariables(status = '') {
            let requestConfig = {
                method: 'get',
                url: `/asset/v1/${LandingPage.endpoint()}/${this.id}/variables.json`,
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

    /**
     * Landing Page Search Params and their validation data
     */
    LandingPage._params = {
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
        description: {
            type: 'string',
            default: null
        },
        createdAt: {
            type: 'string',  //  Date?
            default: null
        },
        updatedAt: {
            type: 'string',  //  Date?
            default: null
        },
        folder: {
            type: 'object',
            default: null,
            example: {
                "type": "Folder",
                "value": 11,
                "folderName": "Landing Pages"
            }
        },
        workspace: {
            type: 'string'
        },
        template: {
            type: 'number'
        },
        title: {
            type: 'string'
        },
        keywords: {
            type: 'string'
        },
        robots: {
            type: 'string',
            default: 'noindex, nofollow',
            choices: [
                'noindex, nofollow',
                'index, nofollow',
                'noindex, follow',
                'index, follow',
            ]
        },
        formPrefill: {
            type: 'boolean'
        },
        mobileEnabled: {
            type: 'boolean',
            default: false
        },
        URL: {
            type: 'string'
        },
        computedUrl: {
            type: 'string'
        }
    }

    //  Mixins
    const drafts = require('./mixins/drafts')
    Object.assign(LandingPage.prototype, drafts)

    return LandingPage
}

module.exports = Spawn