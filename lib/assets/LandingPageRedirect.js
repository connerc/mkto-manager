const path = require('path')
//const BaseAsset = require(path.join(__dirname, 'BaseAsset')).BaseAsset
const yup = require('yup')

/**
 * TODO: This request system always fails code 603 Access Denied
 * @param {*} ParentClass 
 */

const Spawn = (BaseAsset) => {
    class LandingPageRedirect extends BaseAsset {

        static get endpoint() {
            return 'redirectRule'
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
        async getDomains(config = {}) {
            let requestConfig = {
                params: config,
                method: 'get',
                url: `/asset/v1/landingPageDomains.json`,
            }

            return await this.REQ.request(requestConfig)
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