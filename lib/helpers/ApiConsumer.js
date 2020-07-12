const axios = require('axios')
const rateLimit = require('axios-rate-limit')
const axiosRetry = require('axios-retry');


const DEFAULT_CONFIG = {
    // baseURL: 'https://some-domain.com/api/',
    // timeout: 1000,
    // headers: { 'X-Custom-Header': 'foobar' }
}


class ApiConsumer {
    constructor(config, rateLimitConfig = {}, retryCount = 3) {
        this.config = config

        //  Set our Max Request Rate of 100 calls per 20 seconds by default
        let limitConfig = {
            maxRPS: 4,
            ...rateLimitConfig
        }

        //  Spawn the initial axios instance
        let requester = axios.create({
            ...DEFAULT_CONFIG,
            ...config
        })

        //  Set the Retry Limits
        axiosRetry(requester, { 
            retries: retryCount,
            retryDelay: axiosRetry.exponentialDelay
        });

        //  Set our local Axios instance property as teh result of applying our rate limiter config
        this.axios = rateLimit(requester, limitConfig)
    }

    //  Standard Asset/Data Requestor
    async request(requestConfig) {
        try {
            let res = await this.axios.request(requestConfig);

            //console.log('SPECIAL !!!!!', res)
            
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
        catch (error) {
            console.log(error.response); // this is the main part. Use the response property from the error object

            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
                return error.response
            } else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                // http.ClientRequest in node.js
                console.log(error.request);
                return error.request
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log('Error', error.message);
                return error.message
            }
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