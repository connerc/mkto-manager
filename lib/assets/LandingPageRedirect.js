const BaseAsset = require('../BaseAsset').BaseAsset
const yup = require('yup')

const Spawn = (ParentClass = BaseAsset) => {
    class LandingPageRedirect extends ParentClass {

        static get endpoint() {
            return 'redirectRules'
        }

        static async find(searchParams) {
            return await super.find(LandingPageRedirect.endpoint, searchParams)
        }

        constructor(data = {}) {
            super(data)
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
                url: `/asset/v1/${LandingPageRedirect.endpoint}/${this.id}/content.json`,
            }

            //  status = ['', 'approved', 'draft']
            if (status) {
                requestConfig.params = {
                    status: status
                }
            }

            return await this.REQ.mktoRequest(requestConfig)
        }

    }

    // const clone = require('./mixins/clone')
    // const drafts = require('./mixins/drafts')
    // Object.assign(LandingPageRedirect.prototype, drafts, clone)

    /**
     * Schema definition for LandingPage Properties
     */
    LandingPageRedirect.propSchema = BaseAsset.propSchema.shape({
        redirectFromUrl: yup.string().url(),
        hostname: yup.string().url(),
        redirectFrom: yup.object({
            type: yup.string(),
            value: yup.number().integer(),
        }).nullable(),
        redirectTo: yup.object({
            type: yup.string(),
            value: yup.number().integer(),
        }).nullable(),
        redirectToUrl: yup.string().url()
    })

    /**
     * Extend Search Schema
     */
    delete LandingPageRedirect.searchSchema.name
    LandingPageRedirect.searchSchema = BaseAsset.searchSchema.shape({
        status: yup.string().oneOf(['approved', 'draft']),
        redirectTolandingPageId: yup.number().integer(),
        redirectToPath: yup.string(),
        earliestUpdatedAt: yup.date(),
        latestUpdatedAt: yup.date(),
    })

    return LandingPageRedirect
}

module.exports = Spawn