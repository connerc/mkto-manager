const axios = require('axios')
const rateLimit = require('axios-rate-limit')



const DEFAULT_CONFIG = {
    // baseURL: 'https://some-domain.com/api/',
    // timeout: 1000,
    // headers: { 'X-Custom-Header': 'foobar' }
}


class ApiConsumer {
    constructor(config, rateLimitConfig = {}) {
        this.config = config

        //  Set our Max Request Rate of 100 calls per 20 seconds by default
        let limitConfig = {
            maxRPS: 4,
            ...rateLimitConfig
        }

        let requester = axios.create({
            ...DEFAULT_CONFIG,
            ...config
        })

        this.axios = rateLimit(requester, limitConfig)
    }

    //  Standard Asset/Data Requestor
    async request(requestConfig) {
        try {
            let res = await this.axios.request(requestConfig);
            
            return res
            /*
            Example Axios Response Object
            {
                // `data` is the response that was provided by the server
                data: {},

                // `status` is the HTTP status code from the server response
                status: 200,

                // `statusText` is the HTTP status message from the server response
                statusText: 'OK',

                // `headers` the headers that the server responded with
                // All header names are lower cased
                headers: {},

                // `config` is the _config that was provided to `axios` for the request
                config: {},

                // `request` is the request that generated this response
                // It is the last ClientRequest instance in node.js (in redirects)
                // and an XMLHttpRequest instance in the browser
                request: {}
            }
            */
        }
        catch (e) {
            console.log('request: e', e)
            return false
        }
    }

    //  Request Getter Methods
    async get(url, config) {
        return await this.request({
            ...config,
            url: url,
            method: 'get',
        })
    }
    async post(url, payload) {
        return await this.request({
            ...payload,
            url: url,
            method: 'post',
        })
    }
    async put(url, payload) {
        return await this.request({
            ...payload,
            url: url,
            method: 'put',
        })
    }
    async deleteRequest(url, payload) {
        return await this.request({
            ...payload,
            url: url,
            method: 'delete',
        })
    }
}



module.exports.ApiConsumer = ApiConsumer