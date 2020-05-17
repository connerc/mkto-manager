
module.exports = {
    approveDraft: async function() {
        let response = await this.REQ.mktoRequest({
            method: 'post',
            url: `${this.assetEndpoint}/approveDraft.json`,
        })

        return this.makeResponse(response)
    },

    discardDraft: async function() {
        let response = await this.REQ.mktoRequest({
            method: 'post',
            url: `${this.assetEndpoint}/discardDraft.json`,
        })

        return this.makeResponse(response)
    },

    unapprove: async function() {
        let response = await this.REQ.mktoRequest({
            method: 'post',
            url: `${this.assetEndpoint}/unapprove.json`,
        })
        return this.makeResponse(response)
    }
}