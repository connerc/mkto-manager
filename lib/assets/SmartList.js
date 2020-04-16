const BaseAsset = require('../BaseAsset').BaseAsset
const yup = require('yup')

const Spawn = (ParentClass = BaseAsset) => {
    class SmartList extends ParentClass {
        static get endpoint() {
            return 'smartList'
        }

        static async find(searchParams) {
            return await super.find(SmartList.endpoint, searchParams)
        }

        constructor(data) {
            super(data)

            //  Search Params
            /*
            root: JSON  (Parent SmartList),
            maxDepth: Int,
            workSpace: String,
            */

            //  Result Properties
            /*
            description: String,
            isArchive: Boolean,
            name: String,
            type: String ['SmartList', 'SmartList']
            */

            this._protectedProps = [
                ...this._protectedProps,
            ]

            //////////////////////
            //  Indv. Asset Props
        }
    }

    /**
     * Mixins
     */
    const cloneMixin = require('./mixins/clone')
    const deleteMixin = require('./mixins/delete')
    Object.assign(SmartList.prototype, cloneMixin, deleteMixin)

    /**
     * Schema definition for LandingPage Properties
     */
    SmartList.propSchema = BaseAsset.propSchema.shape({
        tags: yup.array(),
        type: yup.string().nullable(),
        channel: yup.string().nullable(),
        costs: yup.string().nullable(),
    })

    /**
     * Extend Search Schema
     */
    SmartList.searchSchema = BaseAsset.searchSchema.shape({
        filterType: yup.string().oneOf([
            'id', 
            'programId',
            'folderId',
            'workspace',
        ]),
        earliestUpdatedAt: yup.date(),
        latestUpdatedAt: yup.date(),
    })

    return SmartList
}

module.exports = Spawn;