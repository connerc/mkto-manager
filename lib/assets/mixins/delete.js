
module.exports = {
    delete: async function() {
        let response = await this.REQ.mktoRequest({
            method: 'post',
            url: `${this.assetEndpoint}/delete.json`,
        })

        return this.makeResponse(response)
    }
}