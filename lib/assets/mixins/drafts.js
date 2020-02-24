module.exports = {
    approveDraft: async function() {
        return await this.REQ.mktoRequest({
            method: 'post',
            url: `${this.assetEndpoint}/approveDraft.json`,
        })
    },

    discardDraft: async function() {
        return await this.REQ.mktoRequest({
            method: 'post',
            url: `${this.assetEndpoint}/discardDraft.json`,
        })
    },

    unapprove: async function() {
        return await this.REQ.mktoRequest({
            method: 'post',
            url: `${this.assetEndpoint}/unapprove.json`,
        })
    }
}