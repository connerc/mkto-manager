//  TODO - FINISH THIS
module.exports = function (methodName, defaultConfig) {
    this[methodName] = function(config) {
        config = {
            ...defaultConfig,
            ...config,
        }

        return await this.REQ.mktoRequest({
            method: 'post',
            url: `${this.assetEndpoint}/${methodName}.json`,
        })
    }
}