const qs = require('qs');


module.exports = {
    ////////////////////////////////////////
    //  Content  ///////////////////////////
    /**
     * Returns an array of all editable Content Sections
     * @param {*} params 
     */
    async getContent(searchParams) {
        let requestConfig = {
            method: 'get',
            url: `${this.assetEndpoint}/content.json`,
            params: searchParams  //  searchParams.status = ['approved', 'draft']
        }

        let contentResponse = await this.request(requestConfig)
        return this.makeResponse(contentResponse)

        /*
        LandingPageContentResponse {
            content (object, optional): Content of the section. Expected values vary based on type. Image: An image URL. RichText: HTML Content. HTML: HTML Content. Form: A form id. Rectangle: Empty. Snippet: A snippet id. ,
            type (string): Type of content section = ['Image', 'SocialButton', 'Form', 'DynamicContent', 'Rectangle', 'Snippet', 'RichText', 'HTML', 'Video', 'Poll', 'ReferralOffer', 'Sweepstakes']

            followupType (string, optional): Follow-up behavior of a form. Only available for form-type content sections. Defaults to form defined behavior. = ['url', 'lp', 'formDefined'],
            followupValue (string, optional): Where to follow-up on form submission. When followupType is lp, accepts the integer id of a landing page. For url, it accepts a url string. ,
            formattingOptions (JsonNode, optional),
            id (object): Id of the content section, may be a string or an int ,
            index (integer, optional): Index of the content section. Index orients the elements from lowest to highest ,
        }
        */
    },

    /**
     * Updates a specific Content Section
     * Params should match whatever was returned in the getContent request
     * @param {integer} contentId 
     * @param {Object} params 
     */
    async updateContent(contentId, bodyContent) {
        let requestConfig = {
            method: 'post',
            url: `${this.assetEndpoint}/content/${contentId}.json`,
            data: qs.stringify(bodyContent),
            // `headers` are custom headers to be sent
            headers: {
                'Authorization': `Bearer ${this.REQ.apiAuthToken.access_token}`, //  TODO: Find a way to omit the Auth token reference here and rely on original def
                'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
            }
        }

        return this.makeResponse(await this.request(requestConfig))
    }
}