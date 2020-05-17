const path = require('path')
const BaseAsset = require(path.join(__dirname, 'BaseAsset')).BaseAsset
const FormData = require('form-data')
const request = require('request')
const fs = require('fs-extra')
const yup = require('yup')

const Spawn = (ParentClass = BaseAsset) => {
    class File extends ParentClass {
        static get endpoint() {
            return 'file'
        }

        static async find(searchParams) {
            return await super.find(File.endpoint, searchParams)
        }

        constructor(data) {
            super(data)

            //  No protected Props
        }



        /**
         * Create (and override) Design Studio Files
         * 
         * @param {*} fileContentStorePath - Local Storage Path for File TODO: Improve this capability
         * @param {*} insertOnly  - Will let us override existing Files with new FileContent (Payload) and MetaData (Including Folder!)
         */
        async create(fileData, insertOnly = true) {
            //  default
            let defaultData = { filePath: false, fileUrl: false, fileStream: false }

            let formData = await this.buildFormData({
                ...defaultData,
                ...fileData
            })
            await formData.append('insertOnly', (insertOnly ? 'true' : 'false'))

            let requestConfig = {
                method: 'post',
                url: `/asset/v1/${File.endpoint}s.json`,
                data: formData,
                // `headers` are custom headers to be sent
                headers: {
                    'Authorization': `Bearer ${this.REQ.apiAuthToken.access_token}`,
                    'content-type': `multipart/form-data; boundary=${formData._boundary}`,
                    'name': 'file',
                    'filename': this.data.name
                }
            }

            let createResponse = await this.REQ.mktoRequest(requestConfig)

            return createResponse
        }

        /**
         * Update existing File Contents - Will need to match MIME Type likely....
         * @param {*} fileContentStorePath 
         */
        async update(fileData = false) {
            //  default
            let defaultData = { filePath: false, fileUrl: false, fileStream: false }

            let formData = await this.buildFormData({
                ...defaultData,
                ...fileData
            })

            let requestConfig = {
                method: 'post',
                url: `${this.assetEndpoint}/content.json`,
                data: formData,
                // `headers` are custom headers to be sent
                headers: {
                    'Authorization': `Bearer ${this.REQ.apiAuthToken.access_token}`,
                    'content-type': `multipart/form-data; boundary=${formData._boundary}`,
                    'name': 'file',
                    'filename': this.data.name
                }
            }
            let updateResponse = await this.REQ.mktoRequest(requestConfig)

            return updateResponse
        }
    }

    /**
     * Schema definition for Folder Properties
     */
    File.propSchema = BaseAsset.propSchema.shape({
        size: yup.number().integer(),
        mimeType: yup.string()  // "image/jpeg",
    })

    /**
     * Extend Search Schema
     */
    //delete File.searchSchema;
    File.searchSchema = BaseAsset.searchSchema.shape({
        //status: yup.string().oneOf(['approved', 'draft']),
    })

    return File
}

module.exports = Spawn;