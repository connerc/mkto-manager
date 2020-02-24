const path = require('path')


const init = function (ApiRequest) {
    class Users {
        static async get(endpoint) {
            return await ApiRequest.mktoRequest({
                method: 'get',
                url: `/${ApiRequest._api_version}/stats/${endpoint}`,
            })
        }

        static async getUsage() {
            return await Usage.get('usage.json')
        }

        
        constructor(data) {
            this._data = data
        }


        async create() {
            let requestConfig = {
                method: 'post',
                url: `/userservice/management/v1/invite.json`,
                params: this.createData
            }
            let createResponse = await this.REQ.mktoRequest(requestConfig)

            return createResponse
        }
    }

    return Users
}