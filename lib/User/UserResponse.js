const MktoResponse = require('../MktoResponse');

//  Create a unique MktoResponse Class for handling User Response
//  Extend the Core MktoResponse class
class UserResponse extends MktoResponse {
    constructor(response, ResultClass) {
        super(response, ResultClass);
    }

    /**
     * Computed Properties
     */
    //  Marketo User Request Success - No Success prop in the data response
    get success() {
        //  201 for User Invite requests, all others are 200
        return this._res.status == 200 || 201 ? true : false;
    }
    //  Raw Marketo Result Array
    get result() {
        return !!this._data ? this._data : {};
    }

    //  Reference to all results as ResultClass instances
    get data() {
        if (!this.result) return {};

        if (Array.isArray(this._data)) {
            return this.result.map(apiRecord => this.createAsset(apiRecord));
        } else {
            return [this.createAsset(this.result)];
        }
    }

    //  Get either first Array result, OR get the entire data object if not an array
    getFirst() {
        if (Array.isArray(this.data)) {
            return this.data[0] ? this.data[0] : false;
        }

        return this.data;
    }
}

module.exports = UserResponse