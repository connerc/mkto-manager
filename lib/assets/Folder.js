const path = require("path");
const BaseAsset = require(path.join(__dirname, "BaseAsset")).BaseAsset;
const MktoResponse = require("../MktoResponse");
const yup = require("yup");

const Spawn = (ParentClass = BaseAsset) => {
    class Folder extends ParentClass {
        static get endpoint() {
            return "folder";
        }

        static async find(searchParams) {
            return await super.find(Folder.endpoint, searchParams);
        }

        constructor(data) {
            super(data);

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

            this._protectedProps = [...this._protectedProps];

            //////////////////////
            //  Indv. Asset Props
        }

        async create() {
            let requestConfig = {
                method: "post",
                url: `/asset/v1/folders.json`,
                params: this.updatedData,
            };
            let createResponse = await this.REQ.mktoRequest(requestConfig);

            return createResponse;
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
            return `${this.assetEndpoint}/tokens`;
        }

        async getTokens() {
            let requestConfig = {
                url: `${this.tokenEndpoint}.json`,
                params: {
                    //folderType: 'Folder'  //  This would dynamically switch between Folder and Program as a Mixin
                    folderType: this.get("folderId").type, //  This would dynamically switch between Folder and Program as a Mixin
                },
            };
            //console.log('requestConfig', requestConfig)

            const getTokensResponse = this.makeResponse(await this.request(requestConfig));
            this.emit("get-tokens", getTokensResponse, this);

            return getTokensResponse;
        }

        /**
         * Create OR Update Tokens - Distinction by data.name Prop
         * @param {*} data
         */
        async createToken(data, type = "create") {
            //  data = {name, type, value}
            //  TODO Validate data here

            let requestConfig = {
                method: "post",
                url: `${this.tokenEndpoint}.json`,
                params: {
                    ...data,
                    //folderType: 'Folder'  //  This would dynamically switch between Folder and Program as a Mixin
                    folderType: this.get("folderId").type, //  This would dynamically switch between Folder and Program as a Mixin
                },
            };
            const createTokenResponse = this.makeResponse(await this.REQ.mktoRequest(requestConfig));
            if (type === "create") {
                this.emit("create-token", createTokenResponse, this);
            }

            return createTokenResponse;
        }

        /**
         * Update is the same request as createToken
         * @param {*} data
         */
        async updateToken(data) {
            const updateTokenResponse = await this.createToken(data, "update");
            this.emit("update-token", updateTokenResponse, this);

            return updateTokenResponse;
        }

        /**
         * Delete a Token
         * @param {*} data
         */
        async deleteToken(data) {
            //  data = {name, type, value}
            //  TODO Validate data here
            let requestConfig = {
                method: "post",
                url: `${this.tokenEndpoint}/delete.json`,
                params: {
                    ...data,
                    //folderType: 'Folder'  //  This would dynamically switch between Folder and Program as a Mixin
                    folderType: this.get("folderId").type, //  This would dynamically switch between Folder and Program as a Mixin
                },
            };
            
            const deleteTokenResponse = this.makeResponse(await this.request(requestConfig));
            this.emit("delete-token", deleteTokenResponse, this);

            return deleteTokenResponse;
        }
    }

    /**
     * Schema definition for Folder Properties
     */
    Folder.propSchema = BaseAsset.propSchema.shape({
        url: yup.string().url().nullable(),

        folderId: yup.object({
            id: yup.number().integer(),
            type: yup.string().oneOf(["Folder", "Program"]),
        }),
        folderType: yup.string(),
        parent: yup
            .object({
                id: yup.number().integer(),
                type: yup.string().oneOf(["Folder", "Program"]),
            })
            .nullable(),

        path: yup.string(),
        isArchive: yup.boolean(),
        isSystem: yup.boolean(),
        accessZoneId: yup.number().integer(),
    });

    /**
     * Extend Search Schema
     */
    Folder.searchSchema = BaseAsset.searchSchema.shape({
        root: yup.object({
            id: yup.number().integer(),
            type: yup.string().oneOf(["Folder", "Program"]),
        }),
        workspace: yup.string(),
    });

    return Folder;
};

module.exports = Spawn;
