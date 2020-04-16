//  retrieve our single shared instance of MktoRequest
const path = require('path')


const init = function (ApiRequest) {
    class Usage {    
        static async get(endpoint) {
            return await ApiRequest.mktoRequest({
                method: 'get',
                url: `/rest/${ApiRequest._apiVersion}/stats/${endpoint}`,
            })
        }
    
        static async getUsage() {
            return await Usage.get('usage.json')
        }
    
        static async getUsageLast7() {
            return await Usage.get('usage/last7days.json')
        }
    
        static async getErrors() {
            return await Usage.get('errors.json')
        }
    
        static async getErrorsLast7() {
            return await Usage.get('errors/last7days.json')
        }
    }

    return Usage
}

//  Proto
//BaseAsset.prototype.REQ = ApiRequest

module.exports.init = init