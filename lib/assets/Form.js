const BaseAsset = require('../BaseAsset').BaseAsset

const Spawn = (ParentClass = BaseAsset) => {
    class Form extends ParentClass {
        static get endpoint() {
            return 'form'
        }

        static async get(searchParams) {
            return await super.get(Form.endpoint, searchParams)
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

    }

    const clone = require('./mixins/clone')
    const drafts = require('./mixins/drafts')
    Object.assign(Form.prototype, drafts, clone)

    Form.prototype.unapprove = null  //  Form does NOT use the unapprove method, weirdly
    
    return Form
}

module.exports = Spawn