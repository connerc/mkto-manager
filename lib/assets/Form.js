const path = require('path')
const BaseAsset = require(path.join(__dirname, 'BaseAsset')).BaseAsset
const yup = require('yup')

const Spawn = (ParentClass = BaseAsset) => {
    class Form extends ParentClass {
        static get endpoint() {
            return 'form'
        }

        static async find(searchParams) {
            return await super.find(Form.endpoint, searchParams)
        }

        static async getFields(config) {
            let _default = { maxReturn: 200, offset: 0 }
            config = {
                ..._default,
                ...config,
            }

            return await super.get(`${Form.endpoint}/field`, config)
        }

        constructor(data) {
            super(data)

            //  No protected Props
        }

        async getThankYou(params) {
            let requestConfig = {
                method: 'get',
                url: `${this.assetEndpoint}/thankYouPage.json`,
                params: params
            }
            let response = await this.request(requestConfig)

            return this.makeResponse(response)
        }

        /**
         * Set one or more new Role entry for this user
         */
        async updateThankYou(config) {
            /*AddRolesRequest {
                input (Array[UserRoleWorkspaceId]): List of roles to add
            }
            UserRoleWorkspaceId {
                accessRoleId (integer): User role id ,
                workspaceId (integer): User workspace id
            }*/
            let requestConfig = {
                method: 'post',
                url: `${this.assetEndpoint}/thankYouPage.json`,
                params: config
            }
            let response = await this.request(requestConfig)

            return this.makeResponse(response)
        }
    }

    /**
     * Schema definition for LandingPage Properties
     */
    Form.propSchema = BaseAsset.propSchema.shape({
        URL: yup.string().url().nullable(),
        computedUrl: yup.string().url().nullable(),

        theme: yup.string(),
        language: yup.string(),
        locale: yup.string(),
        progressiveProfiling: yup.boolean(),
        labelPosition: yup.string(),
        fontFamily: yup.string(),
        fontSize: yup.string(),

        knownVisitor: yup.object({
            type: yup.string(),
            template: yup.string().nullable(),
        }),
        thankYouList: yup.array(),
        // thankYouList: [
        //     {
        //         "followupType": "none",
        //         "followupValue": null,
        //         "default": true
        //     }
        // ],
        buttonLocation: yup.number().integer(),
        buttonLabel: yup.string(),
        waitingLabel: yup.string()
    })

    //  Extend Search Schema
    Form.searchSchema = BaseAsset.searchSchema.shape({
        status: yup.string().oneOf(['approved', 'draft']),
    })

    const clone = require('./mixins/clone')
    const drafts = require('./mixins/drafts')
    Object.assign(Form.prototype, drafts, clone)

    Form.prototype.unapprove = null  //  Form does NOT use the unapprove method, weirdly

    return Form
}

module.exports = Spawn