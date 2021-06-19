//  TODO - test this, esp with module clone configs
module.exports = {
    async clone(config = {}) {
        let requestConfig = {
            method: "post",
            url: `${this.assetEndpoint}/clone.json`,
            data: {
                //  Default Data
                name: "",
                description: "",    
                folder: { id: 0, type: "Folder" },
                //  Default Data
                ...config,
            },
        };

        const cloneResponse = this.makeResponse(await this.request(requestConfig), this.constructor);
        this.emit("clone", cloneResponse, this);

        return cloneResponse;
    },
};
