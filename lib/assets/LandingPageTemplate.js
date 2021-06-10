const path = require("path");
//const BaseAsset = require(path.join(__dirname, "BaseAsset")).BaseAsset;
const yup = require("yup");

const Spawn = (BaseAsset) => {
    class LandingPageTemplate extends BaseAsset {
        static get endpoint() {
            return "landingPageTemplate";
        }

        static async find(searchParams) {
            return await super.find(LandingPageTemplate.endpoint, searchParams);
        }

        constructor(data = {}) {
            super(data);

            this._createRequiredProps = [...this._createRequiredProps, "name", "template", "folder"];

            this._protectedProps = [
                ...this._protectedProps,
                "template",
                "workspace",
                "status",
                "createdAt",
                "updatedAt",
                "URL",
                "computedUrl",
            ];

            this._formData = {
                name: this.get("name").toString(),
                description: this.get("description"),
                folder: JSON.stringify(this.get("folder")).trim(),
                insertOnly: "true",
                templateType: this.get("templateType"),
            };

            /**
             * Landing Page Search Params and their validation data
             */
            let params = {
                id: {
                    type: "number",
                },
                name: {
                    type: "string",
                },
                status: {
                    type: "string",
                    default: "",
                    choices: ["approved", "draft", ""],
                },
                maxReturn: {
                    type: "number",
                    default: 20,
                    min: 1,
                    max: 200,
                },
                offset: {
                    type: "number",
                    default: 0,
                    min: 0,
                    max: null,
                },
                folder: {
                    type: "object",
                    default: null,
                },
            };

            //////////////////////
            //  Indv. Asset Props
        }

        /********************
         * Methods **********
         ********************/
        async create() {
            //  Get this instances FormData - processes pre-defined local props
            let contentFormDataRequestConfig = await this.createFormRequestConfig();

            //  Verify our Request system has an Auth Token
            await this.REQ.getAuthToken();

            //  Merge our formData Request with the URL for content update endpoint
            let requestConfig = {
                method: "post",
                url: `${this.createAssetEndpoint}.json`,
                ...contentFormDataRequestConfig,
            };

            let contentResponse = await this.request(requestConfig);
            return this.makeResponse(contentResponse, LandingPageTemplate);
        }
    }

    /**
     * Mixins
     * LP Templates use the getContent from mixin content, but use the updateContent method from the updateTemplateContent mixin
     * updateTemplateContent mixin is Assigned second so it overrides the original updateContent method from content mixin
     */
    const content = require("./mixins/content");
    const updateTemplateContent = require("./mixins/updateTemplateContent");
    const clone = require("./mixins/clone");
    const drafts = require("./mixins/drafts");
    Object.assign(LandingPageTemplate.prototype, content, updateTemplateContent, drafts, clone);

    /**
     * Schema definition for LandingPage Properties
     */
    LandingPageTemplate.propSchema = BaseAsset.propSchema.shape({
        //URL: yup.string().url().nullable(),
    });

    /**
     * Extend Search Schema
     */
    LandingPageTemplate.searchSchema = BaseAsset.searchSchema.shape({
        status: yup.string().oneOf(["approved", "draft"]),
    });

    return LandingPageTemplate;
};

module.exports = Spawn;
