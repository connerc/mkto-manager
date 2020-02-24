const BaseAsset = require('../BaseAsset').BaseAsset
const Joi = require('@hapi/joi')

const Spawn = (ParentClass = BaseAsset) => {
    class Folder extends ParentClass {
        static get endpoint() {
            return 'folder'
        }

        static async get(searchParams) {
            return await super.get(Folder.endpoint, searchParams)
        }

        constructor(data) {
            super(data)

            //  Search Params
            /*
            root: JSON  (Parent Folder),
            maxDepth: Int,
            workSpace: String,
            */

            //  Result Properties
            /*
            description: String,
            isArchive: Boolean,
            name: String,
            type: String ['Folder', 'Program']
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
        //  TODO Make this a mixin to share between Folder and Program Assets
        get tokenEndpoint() {
            return `/asset/v1/${this.assetEndpoint}/tokens`
        }

        async getToken() {
            let requestConfig = {
                url: `${this.tokenEndpoint}.json`,
                params: {
                    folderType: 'Folder'  //  This would dynamically switch between Folder and Program as a Mixin
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
                    folderType: 'Folder'  //  This would dynamically switch between Folder and Program as a Mixin
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
                    folderType: 'Folder'  //  This would dynamically switch between Folder and Program as a Mixin
                }
            }

            return await this.REQ.mktoRequest(requestConfig)
        }

        //  TODO - No native updateToken, create on that fires a deleteToken and on success, createToken with new value

    }

    return Folder
}

module.exports = Spawn;