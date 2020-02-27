const BaseAsset = require('../BaseAsset').BaseAsset
const yup = require('yup')

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

    //  Mixins
    const drafts = require('./mixins/drafts')
    Object.assign(LandingPage.prototype, drafts)


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