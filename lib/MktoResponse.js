/**
 * Asset Spawn Function with REQ dependency injection
 * @param {} assetName 
 * @param {*} data 
 */
const createAsset = function (assetHandler, data, requestId = false) {
    let AssetObj = new assetHandler(data)

    if (requestId) {
        AssetObj.defineProperty(AssetObj, 'requestId', {
            get() {
                return requestId
            }
        })
    }

    return AssetObj
}


/**
 * MktoResponse Wrapper
 * @param {*} resp 
 * @param {*} config 
 */
const MktoResponse = function (resp, handler = null) {
    var _RESP = {
        resp: resp
    }
    if(handler) {
        _RESP.handler = handler
    }

    Object.defineProperty(_RESP, 'requestId', {
        get() {
            return _RESP.resp.data.requestId
        }
    })

    //  Success States
    Object.defineProperty(_RESP, 'success', {
        get() {
            return (_RESP.resp.status === 200 && _RESP.resp.data.success == true)
        }
    })


    Object.defineProperty(_RESP, 'errors', {
        get() {
            return _RESP.resp.data.errors
        }
    })

    Object.defineProperty(_RESP, 'warnings', {
        get() {
            return _RESP.resp.data.warnings
        }
    })

    Object.defineProperty(_RESP, 'data', {
        get() {
            if (_RESP.resp.data != undefined) {
                return _RESP.resp.data.result
            }

            return null
        }
    })

    /**
     * Array Results
     */
    //if (typeof _RESP.resp.data.result === "Array") {
        //  Result Data Query Methods
        _RESP.getAll = function () {
            if (_RESP.data) {
                return _RESP.data.map(asset => {
                    return createAsset(_RESP.handler, asset)
                })
            }

            return []
        }

        _RESP.getFirst = function () {
            if (_RESP.resp.data.result[0]) {
                return new createAsset(_RESP.handler, _RESP.resp.data.result[0])
            }

            return false
        }

        _RESP.find = function ([prop, operator, value]) {
            return _RESP.data.filter(item => {
                if (operator === '=') {
                    return item[prop] == value
                } else if (operator === '<') {
                    return item[prop] < value
                } else if (operator === '<=') {
                    return item[prop] <= value
                } else if (operator === '>') {
                    return item[prop] > value
                } else if (operator === '>=') {
                    return item[prop] >= value
                }
            })
        }
    //}
    


    _RESP.add = function (resp) {

    }

    //console.log('** Mkto Response Data: ', _RESP.resp.data)

    return _RESP
}

module.exports = MktoResponse