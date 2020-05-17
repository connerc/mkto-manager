const path = require('path')
const BaseAsset = require(path.join(__dirname, 'BaseAsset')).BaseAsset
const yup = require('yup')

const Spawn = (ParentClass = BaseAsset) => {
    class Program extends ParentClass {
        static get endpoint() {
            return 'program'
        }

        static async find(searchParams) {
            return await super.find(Program.endpoint, searchParams)
        }

        constructor(data) {
            super(data)

            //  Search Params
            /*
            root: JSON  (Parent Program),
            maxDepth: Int,
            workSpace: String,
            */

            //  Result Properties
            /*
            description: String,
            isArchive: Boolean,
            name: String,
            type: String ['Program', 'Program']
            */

            this._protectedProps = [
                ...this._protectedProps,
            ]

            //////////////////////
            //  Indv. Asset Props
        }

        async create() {
            let requestConfig = {
                method: 'post',
                url: `/asset/v1/folders.json`,
                params: this.updatedData
            }
            let createResponse = await this.REQ.mktoRequest(requestConfig)

            return createResponse
        }

        // async update() {
        //     let requestConfig = {
        //         method: 'post',
        //         url: `${this.assetEndpoint}.json`,
        //         params: this.updatedData
        //         //data: this.updatedData
        //     }
        //     let updateResponse = await this.REQ.mktoRequest(requestConfig)

        //     return updateResponse
        // }

        async delete() {
            //  TODO This requires FormData, and requires a handler for failed responses where folder has content and cannot be deleted
            // let requestConfig = {
            //     method: 'post',
            //     url: `${this.assetEndpoint}/delete.json`,
            //     params: this.updatedData
            //     //data: this.updatedData
            // }
            // let updateResponse = await this.request(requestConfig)

            // return updateResponse
        }


        /******************************************
         * Tokens *********************************
         *******************************************/
        //  TODO Make this a mixin to share between Program and Program Assets
        get tokenEndpoint() {
            return `/asset/v1/${this.assetEndpoint}/tokens`
        }

        async getToken() {
            let requestConfig = {
                url: `${this.tokenEndpoint}.json`,
                params: {
                    folderType: 'Program'  //  This would dynamically switch between Program and Program as a Mixin
                }
            }

            return await this.request(requestConfig)
        }

        async createToken(data) {
            //  data = {name, type, value}
            //  TODO Validate data here

            let requestConfig = {
                method: 'post',
                url: `${this.tokenEndpoint}.json`,
                params: {
                    ...data,
                    folderType: 'Program'  //  This would dynamically switch between Program and Program as a Mixin
                }
            }

            return await this.REQ.mktoRequest(requestConfig)
        }
        async deleteToken(data) {
            //  data = {name, type, value}
            //  TODO Validate data here
            let requestConfig = {
                method: 'post',
                url: `${this.tokenEndpoint}/delete.json`,
                params: {
                    ...data,
                    folderType: 'Program'  //  This would dynamically switch between Program and Program as a Mixin
                }
            }

            return await this.REQ.mktoRequest(requestConfig)
        }

        //  TODO - No native updateToken, create on that fires a deleteToken and on success, createToken with new value

    }

    /**
     * Schema definition for LandingPage Properties
     */
    Program.propSchema = BaseAsset.propSchema.shape({
        tags: yup.array(),
        type: yup.string().nullable(),
        channel: yup.string().nullable(),
        costs: yup.string().nullable(),
    })

    /**
     * Extend Search Schema
     */
    Program.searchSchema = BaseAsset.searchSchema.shape({
        filterType: yup.string().oneOf([
            'id', 
            'programId',
            'folderId',
            'workspace',
        ]),
        earliestUpdatedAt: yup.date(),
        latestUpdatedAt: yup.date(),
    })

    return Program
}

module.exports = Spawn;