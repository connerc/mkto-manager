const path = require('path')
const { ApiConsumer } = require(path.join(__dirname, './helpers/ApiConsumer'))

/**
 * Request Marketo Items via REST API
 * Contains the logic for retrieving and storing Auth Tokens, 
 * as well as executing all other Requests and returning the raw ApiConsumer (extended Axios) Response
 */
class MktoRequest {
    constructor({ mktoBaseUrl, mktoClientId, mktoClientSecret }) {
        this._apiVersion = 'v1'
        //  We define this at a "global" Marketo handler like this, BUT, 
        //  it is likely Marketo will only update certain endpoints at a time, 
        //  so this cannot apply this version number to all requests inherently

        this._config = {
            baseUrl: mktoBaseUrl,
            clientId: mktoClientId,
            clientSecret: mktoClientSecret
        }

        /**
         * Request Handler Storage
         * Instantiates ApiConsumer, a special, rate limited instance of Axios
         */
        this.REQ = new ApiConsumer(
            //  Consumer Config
            {baseURL: this._config.baseUrl},
            //  Rate Limiter Config
            {maxRPS: 4,}
        )

        //  Mkto API Token Storage
        this.apiAuthToken = false
    }

    /**
     * Depict the Endpoint by search params
     * Common Marketo endpoint configuration depending on the content of Search Params object supplied
     * Primarily used for Asset endpoints, offered as a static helper
     * @param {*} endpoint 
     * @param {*} searchParams 
     */
    createSearchParams(endpoint, searchParams) {
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
     * Retrieve a Marketo Request Authorization Token using our API Client credentials
     */
    async getAuthToken() {
        const RightNow = Date.now()

        if (this.apiAuthToken) {
            if (this.apiAuthToken._expire > RightNow) return true
        }

        let authEndPoint = '/identity/oauth/token'

        const authResp = await this.REQ.get(authEndPoint, {
            params: {
                grant_type: 'client_credentials',
                client_id: this._config.clientId,
                client_secret: this._config.clientSecret
            }
        })

        if (authResp.status == 200) {
            this.apiAuthToken = authResp.data

            const AfterResponseDate = Date.now()

            //  Store our timestamp when this will expire
            if (!!authResp.data.expires_in) {
                //  Set the expiration data to be NOW + expires_in converted to milliseconds
                this.apiAuthToken._expire = (AfterResponseDate + (authResp.data.expires_in * 1000))
                this.apiAuthToken._defaulted = false
            }
            else {
                this.apiAuthToken._expire = (AfterResponseDate.getTime() + (3599 * 1000))
                this.apiAuthToken._defaulted = true
            }

            return true
        }

        return false
    }


    /**
     * Make a MktoRequest with our Auth token Bearer
     * @param {*} requestConfig 
     */
    async mktoRequest(requestConfig = {}) {
        //  Auth Token - Retrieve if needed
        if (await this.getAuthToken()) {
            
            let customHeaders = (requestConfig.headers) ? requestConfig.headers : {}
            delete requestConfig.headers

            //  Default mktoRequest Config to merge
            const mktoRequestConfig = {
                //  Include stored AuthToken as header data
                headers: {
                    Authorization: `Bearer ${this.apiAuthToken.access_token}`,
                    ...customHeaders
                },
                
                //  Merge in the Request Config
                ...requestConfig,
                
                //  Define the full URI for the request - domain set in initialization credentials
                url: requestConfig.url
            }

            const res = await this.REQ.request(mktoRequestConfig)
            res.apiAuthToken = this.apiAuthToken

            return res
        }
    }

    //////////////////////////////////////
    //  Special Requests  ////////////////
    //////////////////////////////////////
    //  These should likely be moved to their specific Base classes, BaseAsset, BaseLead, etc

    /**
     * Retrieve a Marketo Asset
     * @param {*} assetUri 
     * @param {*} searchParams 
     */
    async getLead(leadUri, searchParams = {}) {
        //  Build Asset URI with our known prepend
        let endpoint = MktoRequest.createSearchParams(`/${this._apiVersion}/${leadUri}`, searchParams)

        //console.log('endpoint', endpoint)

        return await this.mktoRequest({
            url: endpoint,
            params: searchParams
        }).catch(error => console.log('MktoRequest error', error));

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
        let endpoint = MktoRequest.createSearchParams(`/bulk/${this._apiVersion}/${bulkUri}`, searchParams)

        //console.log('++ Request Endpoint', endpoint)

        return await this.mktoRequest({
            url: endpoint,
            params: searchParams
        }).catch(error => console.log('MktoRequest error', error));

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
}

// function init({ mktoBaseUrl, mktoClientId, mktoClientSecret }) {
//     const mktoRequest = new MktoRequest({ mktoBaseUrl, mktoClientId, mktoClientSecret })
//     //Object.freeze(mktoRequest)

//     return mktoRequest
// }

module.exports = MktoRequest