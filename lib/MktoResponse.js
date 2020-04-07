class MktoResponse {
    constructor(response, Asset) {
        //  Full Response minus data
        this._res = Object.assign({}, response);
        delete this._res.data;

        //  Store the asset class to instantiate from
        if (typeof Asset == "undefined") Asset = apiRecord => apiRecord
        this._asset = Asset

        //  Response Data
        this.status = response.status


        //  Data Response Properties
        this.success = response.data.success
        this.result = (!!response.data.result ? response.data.result : [])
        this.warnings = (!!response.data.warnings ? response.data.warnings : [])
        this.errors = (!!response.data.errors ? response.data.errors : [])

        //  Full Data Response
        this._data = response.data
    }

    createAsset(apiRecord) {
        return new this._asset(apiRecord)
    }

    get data() {
        if (!this.result) return []
        return this.result.map(apiRecord => this.createAsset(apiRecord))
    }

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

    getFirst() {
        return (this.data[0]) ? this.data[0] : false
    }

    getAll() {
        return this.data
    }
}

MktoResponse.toBoolean = function () {
    return ((this.status == 200) && (this.success))
}


module.exports = MktoResponse