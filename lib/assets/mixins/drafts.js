const { response } = require("express");

module.exports = {
    async approveDraft() {
        let requestConfig = {
            method: "post",
            url: `${this.assetEndpoint}/approveDraft.json`,
        };

        const approveResponse = this.makeResponse(await this.request(requestConfig));
        this.emit("approve-draft", approveResponse, this);

        if(approveResponse.success) {
            this.data.status = "approved"
            this.cacheData()
        }

        return approveResponse;
    },

    async discardDraft() {
        let requestConfig = {
            method: "post",
            url: `${this.assetEndpoint}/discardDraft.json`,
        };

        const discardDraftResponse = this.makeResponse(await this.request(requestConfig));
        this.emit("discard-draft", discardDraftResponse, this);

        //  TODO - review if this should be done here with a draft dismissal
        if(discardDraftResponse.success) {
            this.data.status = "approved"
            this.cacheData()
        }

        return discardDraftResponse;
    },

    async unapprove() {
        let requestConfig = {
            method: "post",
            url: `${this.assetEndpoint}/unapprove.json`,
        };  

        const unapproveResponse = this.makeResponse(await this.request(requestConfig));
        this.emit("unapprove", unapproveResponse, this);

        if(unapproveResponse.success) {
            this.data.status = "draft"
            this.cacheData()
        }

        return unapproveResponse;
    },
};
