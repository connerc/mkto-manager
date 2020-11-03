module.exports = {
    async approveDraft() {
        let requestConfig = {
            method: "post",
            url: `${this.assetEndpoint}/approveDraft.json`,
        };

        const approveResponse = this.makeResponse(await this.request(requestConfig));
        this.emit("approve-draft", approveResponse, this);

        return approveResponse;
    },

    async discardDraft() {
        let requestConfig = {
            method: "post",
            url: `${this.assetEndpoint}/discardDraft.json`,
        };

        const discardDraftResponse = this.makeResponse(await this.request(requestConfig));
        this.emit("discard-draft", discardDraftResponse, this);

        return discardDraftResponse;
    },

    async unapprove() {
        let requestConfig = {
            method: "post",
            url: `${this.assetEndpoint}/unapprove.json`,
        };

        const unapproveResponse = this.makeResponse(await this.request(requestConfig));
        this.emit("unapprove", unapproveResponse, this);

        return unapproveResponse;
    },
};
