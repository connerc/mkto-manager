const path = require('path')
//const BaseAsset = require(path.join(__dirname, 'BaseAsset')).BaseAsset
const yup = require('yup')

const Spawn = (BaseAsset) => {
    class Segment extends BaseAsset {
        static get endpoint() {
            return 'segmentation'
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