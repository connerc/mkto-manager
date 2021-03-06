const qs = require("qs");

module.exports = {
    ////////////////////////////////////////
    //  Variables  /////////////////////////
    /**
     * Retrieve array of all editable Variables for this email
     * @param {*} status
     */
    async getVariables(params) {
        let requestConfig = {
            method: "get",
            url: `${this.assetEndpoint}/variables.json`,
            params: params, //  params.status = ['', 'approved', 'draft']
        };

        const variableResponse = this.makeResponse(await this.request(requestConfig));
        this.emit("get-variables", variableResponse, this);

        return variableResponse;
    },

    /**
     * Update a specific editable Variable
     * @param {*} variableId
     * @param {*} value
     */
    async updateVariable(variableId, newValue) {
        let requestConfig = {
            method: "post",
            url: `${this.assetEndpoint}/variable/${variableId}.json`,
            data: qs.stringify({ value: newValue }),
            // `headers` are custom headers to be sent
            headers: {
                Authorization: `Bearer ${this.REQ.apiAuthToken.access_token}`, //  TODO: Find a way to omit the Auth token reference here and rely on original def
                "content-type": "application/x-www-form-urlencoded; charset=utf-8",
            },
        };

        const updateVariableResponse = this.makeResponse(await this.request(requestConfig));
        this.emit("update-variables", updateVariableResponse, this);

        return updateVariableResponse;
    },
};
