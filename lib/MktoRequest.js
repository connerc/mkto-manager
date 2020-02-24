const fs = require('fs-extra')
const path = require('path')
//const consola = require('consola')
/*const tracer = require('tracer')
const mktoLogger = tracer.create({
    level: 0,
    defaults: {
        additionalColor: 'white'
    }
})*/
const mktoLogger = console
const { ApiConsumer } = require(path.join(__dirname, './helpers/ApiConsumer'))

/**
 * Request Marketo Items via REST API
 */
class MktoRequest {
    constructor({ mktoBaseUrl, mktoClientId, mktoClientSecret }) {

        this._api_version = 'v1'

        this._config = {
            baseUrl: mktoBaseUrl,
            clientId: mktoClientId,
            clientSecret: mktoClientSecret
        }

        /**
         * 
         */
        this.REQ = new ApiConsumer({
            baseURL: this._config.baseUrl,
        })

        //  Mkto API Token Storage
        this.apiAuthToken = false
    }

    //  Depict the Endpoint by search params
    static createSearchParams(endpoint, searchParams) {
        //  Search Query type, in descending scope order
        if (searchParams.id) {
            endpoint = endpoint + `/${searchParams.id}.json`
        }
        else if (searchParams.name) {
            endpoint = endpoint + `/byName.json`
        }
        else {
            endpoint = endpoint + `s.json`
        }

        return endpoint
    }

    /**
     * Retrieve a Request Authorization Token using our API Client credentials
     */
    async getAuthToken() {
        if (this.apiAuthToken) {
            if (this.apiAuthToken._expire < (Date.now() - 1000)) return true
            //return true
        }

        mktoLogger.log('-- Retrieving Auth Token')
        let authEndPoint = '/identity/oauth/token'

        const authResp = await this.REQ.request({
            url: authEndPoint,
            params: {
                grant_type: 'client_credentials',
                client_id: this._config.clientId,
                client_secret: this._config.clientSecret
            }
        })

        //mktoLogger.log('authResp', authResp)

        if (authResp.status == 200) {
            this.apiAuthToken = authResp.data

            //  Store our timestamp when this will expire
            if (authResp.data.expires_in) {
                this.apiAuthToken._expire = (Date.now() + authResp.data.expires_in)
            }
            else {
                this.apiAuthToken._expire = (Date.now() + 5000)
            }

            mktoLogger.log('  |   Auth Token Retrieved')
            return true
        }

        mktoLogger.error('!! Auth Token Error:', authResp)

        return false
    }


    /**
     * Make a MktoRequest with our Auth token Bearer
     * @param {*} requestConfig 
     */
    async mktoRequest(requestConfig = {}) {
        //  Auth Token - Retrieve if needed
        if (await this.getAuthToken()) {
            //  Default mktoRequest Config to merge
            const mktoRequestConfig = {
                headers: {
                    Authorization: `Bearer ${this.apiAuthToken.access_token}`
                },
                ...requestConfig,
                url: '/rest' + requestConfig.url
            }

            mktoLogger.log('  |  MktoRequest:', mktoRequestConfig)
            mktoLogger.log('  |  ')

            //mktoLogger.log('mktoRequestConfig', mktoRequestConfig)
            let res = await this.REQ.request(mktoRequestConfig)
            //mktoLogger.log('mktoRequest res', res)

            return res
        }
    }

    //////////////////////////////////////
    //  Special Requests  ////////////////
    //////////////////////////////////////

    /**
     * Retrieve a Marketo Asset
     * @param {*} assetUri 
     * @param {*} searchParams 
     */
    async getAsset(assetUri, searchParams = {}) {
        //  Build Asset URI with our known prepend
        let endpoint = MktoRequest.createSearchParams(`/asset/${this._api_version}/${assetUri}`, searchParams)

        return await this.mktoRequest({
            url: endpoint,
            params: searchParams
        }).catch(error => console.log('MktoRequest error', error));
        //mktoLogger.log('resp', resp)

        /* Example response {
            status: 200,
            statusText: 'OK',
            data: {
                success: true,
                errors: [],  //  If success === false
                requestId: '10feb#16e26d4997c',
                warnings: [],
                result: [  //  If success === true
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object]
                ]
            }
        }*/
    }


    /**
     * Retrieve a Marketo Lead
     * @param {*} assetUri 
     * @param {*} searchParams 
     */
    async getLead(leadUri, searchParams = {}) {
        //  Build Asset URI with our known prepend
        let endpoint = MktoRequest.createSearchParams(`/${this._api_version}/${leadUri}`, searchParams)

        console.log('endpoint', endpoint)

        return await this.mktoRequest({
            url: endpoint,
            params: searchParams
        }).catch(error => console.log('MktoRequest error', error));
        //mktoLogger.log('resp', resp)

        /* Example response {
            status: 200,
            statusText: 'OK',
            data: {
                success: true,
                errors: [],  //  If success === false
                requestId: '10feb#16e26d4997c',
                warnings: [],
                result: [  //  If success === true
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object]
                ]
            }
        }*/
    }

    /**
     * Retrieve a Marketo Asset
     * @param {*} assetUri 
     * @param {*} searchParams 
     */
    async getBulk(bulkUri, searchParams = {}) {
        //  Build Asset URI with our known prepend
        let endpoint = MktoRequest.createSearchParams(`/bulk/${this._api_version}/${bulkUri}`, searchParams)

        console.log('++ Request Endpoint', endpoint)

        return await this.mktoRequest({
            url: endpoint,
            params: searchParams
        }).catch(error => console.log('MktoRequest error', error));
        //mktoLogger.log('resp', resp)

        /* Example response {
            status: 200,
            statusText: 'OK',
            data: {
                success: true,
                errors: [],  //  If success === false
                requestId: '10feb#16e26d4997c',
                warnings: [],
                result: [  //  If success === true
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object]
                ]
            }
        }*/
    }

    /**
     * Retrieve Marketo User
     * @param {*} userUri 
     * @param {*} searchParams 
     */
    async getUser(userUri, searchParams = {}) {
        //  Build Asset URI with our known prepend
        let endpoint = MktoRequest.createSearchParams(`/userservice/management/${this._api_version}/users/${userUri}`, searchParams)

        console.log('++ Request Endpoint', endpoint)

        return await this.mktoRequest({
            url: endpoint,
            params: searchParams
        }).catch(error => console.log('MktoRequest error', error));
    }
}

function init({ mktoBaseUrl, mktoClientId, mktoClientSecret }) {
    const mktoRequest = new MktoRequest({ mktoBaseUrl, mktoClientId, mktoClientSecret })
    //Object.freeze(mktoRequest)

    return mktoRequest
}

module.exports.MktoRequest = MktoRequest
module.exports.init = init