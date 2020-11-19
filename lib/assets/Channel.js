const path = require('path')
//const BaseAsset = require(path.join(__dirname, 'BaseAsset')).BaseAsset
const yup = require('yup')

const Spawn = (BaseAsset) => {
    class Channel extends BaseAsset {
        static get endpoint() {
            return 'channel'
        }

        static async find(searchParams) {
            return await super.find(Channel.endpoint, searchParams)
        }

        constructor(data) {
            super(data)

            //  No protected Props
        }



        /**
         * VOID - API does not allow for Channel Creation
         */
        async create() {
            //
        }

        /**
         * VOID - API does not allow for Channel Creation
         */
        async update() {
            //
        }
    }

    /**
     * Schema definition for Folder Properties
     */
    Channel.propSchema = BaseAsset.propSchema.shape({
        size: yup.number().integer(),
        mimeType: yup.string()  // "image/jpeg",
    })

    /**
     * Extend Search Schema
     */
    //delete Channel.searchSchema;
    Channel.searchSchema = BaseAsset.searchSchema.shape({
        //status: yup.string().oneOf(['approved', 'draft']),
    })

    return Channel
}

module.exports = Spawn;