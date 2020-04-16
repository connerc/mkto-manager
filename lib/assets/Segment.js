const BaseAsset = require('../BaseAsset').BaseAsset
const yup = require('yup')

const Spawn = (ParentClass = BaseAsset) => {
    class Segment extends ParentClass {
        static get endpoint() {
            return 'channel'
        }

        static async find(searchParams) {
            return await super.find(Segment.endpoint, searchParams)
        }

        constructor(data) {
            super(data)

            //  No protected Props
        }



        /**
         * VOID - API does not allow for Segment Creation
         */
        async create() {
            //
        }

        /**
         * VOID - API does not allow for Segment Creation
         */
        async update() {
            //
        }
    }

    /**
     * Schema definition for Folder Properties
     */
    Segment.propSchema = BaseAsset.propSchema.shape({
        size: yup.number().integer(),
        mimeType: yup.string()  // "image/jpeg",
    })

    /**
     * Extend Search Schema
     */
    //delete Segment.searchSchema;
    Segment.searchSchema = BaseAsset.searchSchema.shape({
        //status: yup.string().oneOf(['approved', 'draft']),
    })

    return Segment
}

module.exports = Spawn;