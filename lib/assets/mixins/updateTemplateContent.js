const Readable = require("stream").Readable;

module.exports = {
    /**
     * Updates Template content, different from traditional Asset content updates
     * Params should match whatever was returned in the getContent request
     * @param {integer} contentId 
     * @param {Object} params 
     */
    async updateContent(fileContents) {
         //  Create a FileStream using the Node Readable Library
         const readable = Readable.from(fileContents, { encoding: "utf8" });
         let fileStream = "";
         for await (const chunk of readable) {
             fileStream += chunk;
         }

         //  Verify our Request system has an Auth Token
         await this.REQ.getAuthToken();

         //  If this has folder data to update, trick it into running a Create request instead
         //  TODO Determine if this is still a valid trick
         /* if (!!this.changedData['folder']) {
             //  Switch to the Create endpoint because screw logic I guess
             requestConfig.url = `/rest/asset/v1/landingPageTemplates.json`
             requestConfig
         } */

         //  Generate our form-data content type request config
         let contentFormDataRequestConfig = await this.createFormRequestConfig(fileStream);

         //  Merge our formData Request with the URL for content update endpoint
         let requestConfig = {
             method: "post",
             url: `${this.assetEndpoint}/content.json`,
             ...contentFormDataRequestConfig,
         };

        return this.makeResponse(await this.request(requestConfig))
    }
}