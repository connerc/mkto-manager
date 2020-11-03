module.exports = {
    async delete() {
        let requestConfig = {
            method: "post",
            url: `${this.assetEndpoint}/delete.json`,
        };

        const deleteResponse = this.makeResponse(await this.request(requestConfig));
        this.emit("delete", deleteResponse, this);

        return deleteResponse;
    },
};
