/**
 * Handler class for Marketo API Responses
 * Included logic for HTTP Response testing, and for Marketo result AR class instantiation and error/warning responses
 * 
 * Should be flexible enough to handle ALL HTTP responses from the Marketo API
 */
class MktoResponse {
    constructor(response, ResultClass) {
        //  Full Response minus data
        this._res = Object.assign({}, response);
        delete this._res.data;

        //  Store the asset/lead/generic handler class to instantiate results from
        if (typeof ResultClass == "undefined") ResultClass = Object  //  Default back to regular Object if we do not pass a specific handler
        this._resultClass = ResultClass

        //  Full HTTP Request Data Response
        this._data = response.data
    }

    /**
     * Computed Properties
     */
    //  HTTP Request Status
    get status() {
        return this._res.status
    }
    //  Marketo Request Success
    get success() {
        return (!!this._data.success ? this._data.success : false)
    }
    //  Raw Marketo Result Array
    get result() {
        return (!!this._data.result ? this._data.result : [])
    }
    //  Raw Marketo Warnings Array
    get warnings() {
        return (!!this._data.warnings ? this._data.warnings : [])
    }
    //  Raw Marketo Errors Array
    get errors() {
        return (!!this._data.errors ? this._data.errors : [])
    }
    //  Reference to all results as ResultClass instances
    get data() {
        if (!this.result) return []
        return this.result.map(apiRecord => this.createAsset(apiRecord))
    }

    get summary() {
        return {
            //  Request
            header: this._res.request._header,
            requestURL: this._res.config.url,
            method: this._res.config.method,
            params: this._res.config.params,
            //  Response
            status: this._res.status,
            success: this.success,
            result: this.result,
            errors: this.errors,
            warnings: this.warnings,
        }
    }

    /**
     * Helper method for instantiating result records as the stored _resultClass
     * @param {Object} apiRecord 
     */
    createAsset(apiRecord) {
        return new this._resultClass(apiRecord)
    }

    /**
     * Filter down the results and return array, and methods to get first instantiated, all instantiated?
     * TODO: Review this, was an interesting idea...
     * @param {Object} searchParams 
     */
    search(searchParams) {
        if (!this.result) return false

        let filteredResults = this.result.filter(resultItem => {
            let matchCount = 0

            for (let prop in searchParams) {
                let val = searchParams[prop]

                if (!resultItem[prop]) return

                if (resultItem[prop] == val) {
                    matchCount++
                }
            }

            return (matchCount > 0) ? resultItem : false
        })

        return {
            ...filteredResults,
            getFirst: function () {
                return (filteredResults[0]) ? filteredResults[0] : false
            },
            getLast: function () {
                return (filteredResults[0]) ? filteredResults[0] : false
            },
        }
    }

    //  Get first instantiated result item
    getFirst() {
        return (this.data[0]) ? this.data[0] : false
    }

    //  Get all  instantiated result items
    getAll() {
        return this.data
    }
}

//  Create a boolean magic method that returns the state of both the HTTP request status and the Marketo request state
// MktoResponse.toBoolean = function () {
//     return ((this.status == 200) && (this.success))
// }


module.exports = MktoResponse