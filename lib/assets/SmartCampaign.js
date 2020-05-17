const path = require('path')
const BaseAsset = require(path.join(__dirname, 'BaseAsset')).BaseAsset
const yup = require('yup')

const Spawn = (ParentClass = BaseAsset) => {
    class SmartCampaign extends ParentClass {
        static get endpoint() {
            return 'smartCampaign'
        }

        static async find(searchParams) {
            return await super.find(SmartCampaign.endpoint, searchParams)
        }

        constructor(data) {
            super(data)

            //  Search Params
            /*
            root: JSON  (Parent SmartCampaign),
            maxDepth: Int,
            workSpace: String,
            */

            //  Result Properties
            /*
            description: String,
            isArchive: Boolean,
            name: String,
            type: String ['SmartCampaign', 'SmartCampaign']
            */

            this._protectedProps = [
                ...this._protectedProps,
            ]

            //////////////////////
            //  Indv. Asset Props
        }

        
        /*******************************************
         * Activate ********************************
         *******************************************/
        /**
         * Set one or more new Role entry for this user
         */
        async activate() {
            let requestConfig = {
                method: 'post',
                url: `${this.assetEndpoint}/activate.json`,
                params: config
            }
            let response = await this.request(requestConfig)

            return this.makeResponse(response)
        }
        /**
         * Set one or more new Role entry for this user
         */
        async deactivate() {
            let requestConfig = {
                method: 'post',
                url: `${this.assetEndpoint}/deactivate.json`,
                params: config
            }
            let response = await this.request(requestConfig)

            return this.makeResponse(response)
        }





        /**
         * SmartList
         */
        async smartList() {
            let requestConfig = {
                method: 'get',
                url: `${this.assetEndpoint}/smartList.json`,
            }
            let response = await this.request(requestConfig)

            return this.makeResponse(response)
        }
    }

    /**
     * Mixins
     */
    const cloneMixin = require('./mixins/clone')
    const deleteMixin = require('./mixins/delete')
    Object.assign(SmartCampaign.prototype, cloneMixin, deleteMixin)

    /**
     * Schema definition for LandingPage Properties
     */
    SmartCampaign.propSchema = BaseAsset.propSchema.shape({
        tags: yup.array(),
        type: yup.string().nullable(),
        channel: yup.string().nullable(),
        costs: yup.string().nullable(),
    })

    /**
     * Extend Search Schema
     */
    SmartCampaign.searchSchema = BaseAsset.searchSchema.shape({
        filterType: yup.string().oneOf([
            'id', 
            'programId',
            'folderId',
            'workspace',
        ]),
        earliestUpdatedAt: yup.date(),
        latestUpdatedAt: yup.date(),
    })

    return SmartCampaign
}

module.exports = Spawn;