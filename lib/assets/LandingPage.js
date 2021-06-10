const path = require('path')
const BaseAsset = require(path.join(__dirname, 'BaseAsset')).BaseAsset
const yup = require('yup')

//  Plugins - extend Asset in advanced systems compared to shared Mixins
const makeLogPlugin = require('./plugins/makeLog')

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

        static async find(searchParams) {
            return await super.find(LandingPage.endpoint, searchParams)
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

            //  Plugins
            makeLogPlugin(this)

            //////////////////////
            //  Indv. Asset Props
        }

        /********************
         * Methods **********
         ********************/
        ////////////////////////////////////////
        //  FullContent  ///////////////////////
        //  TODO: Implement event emit here
        async getFullContent() {
            if (this.get('status') == 'approved' && this.get('URL')) {
                const pageUrl = this.get('URL')
                try {
                    let response = await myAxios.get(pageUrl)

                    return {
                        status: response.status,
                        success: (response.status === 200),
                        data: response.data,
                        errors: [],
                        warnings: []
                    }
                }
                catch (error) {
                    let returnData = { 
                        success: false,
                        error: [error.message || null],
                        warnings: []
                    };

                    if (error.response) {
                        returnData = {
                            ...returnData,
                            status: error.response.status,
                            data: error.response.data,
                        }
                    } else if (error.request) {
                        returnData = {
                            ...returnData,
                            status: 500,
                            data: error.request
                        }
                    }

                    return {
                        //  Defaults
                        status: 666,
                        data: error.message,
                        errors: [error.message],
                        warnings: [],
                        //  Custom
                        ...returnData,
                    }
                }
            }
            else {
                return false
            }
        }

        ////////////////////
        /*
        ////////////////////////////////////////
        //  Content  ///////////////////////////
        async getContent(params) {
            let requestConfig = {
                method: 'get',
                url: `${this.assetEndpoint}/content.json`,
                params: params
            }

            let contentResponse = await this.request(requestConfig)
            return this.makeResponse(contentResponse)
        }
        async updateContent(contentId, bodyContent) {
            let requestConfig = {
                method: 'post',
                url: `${this.assetEndpoint}/content/${contentId}.json`,
                data: qs.stringify(bodyContent),
                // `headers` are custom headers to be sent
                headers: {
                    'Authorization': `Bearer ${this.REQ.apiAuthToken.access_token}`,
                    'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
                }
            }

            return this.makeResponse(await this.request(requestConfig))
        } */

        ////////////////////
        ////////////////////////////////////////
        //  Variables  /////////////////////////
        /* async getVariables(status = '') {
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
        } */
    }

    /**
     * Mixins
     */
    const draftsMixin = require('./mixins/drafts')
    const contentMixin = require('./mixins/content')
    const variablesMixin = require('./mixins/variables')
    const deleteMixin = require('./mixins/delete')
    Object.assign(LandingPage.prototype, draftsMixin, contentMixin, variablesMixin, deleteMixin)


    /**
     * Schema definition for LandingPage Properties
     */
    LandingPage.propSchema = BaseAsset.propSchema.shape({
        URL: yup.string().url().nullable(),
        computedUrl: yup.string().url().nullable(),
        template: yup.number().integer(),
        title: yup.string(),
        keywords: yup.string(),
        robots: yup.string().oneOf([
            'index, follow',
            'index, nofollow',
            'noindex, follow',
            'noindex, nofollow',
        ]),
        formPrefill: yup.boolean(),
        mobileEnabled: yup.boolean(),
    })

    /**
     * Extend Search Schema
     */
    LandingPage.searchSchema = BaseAsset.searchSchema.shape({
        status: yup.string().oneOf(['approved', 'draft']),
    })

    return LandingPage
}

module.exports = Spawn