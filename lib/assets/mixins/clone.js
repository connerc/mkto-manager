//  TODO - test this, esp with module clone configs
module.exports = {
    async clone(config) {
        let _defaultConfig = {
            name: '',
            description: '',
            folder: {id: 0, type: 'Folder'},
        }
        config = {
            ..._defaultConfig,
            ...config,
        }

        return await this.REQ.mktoRequest({
            method: 'post',
            url: `${this.assetEndpoint}/clone.json`,
        })
    }
}