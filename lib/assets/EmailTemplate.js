const fs = require("fs");
const path = require("path");
//const BaseAsset = require(path.join(__dirname, "BaseAsset")).BaseAsset;
const yup = require("yup");

const Spawn = (BaseAsset) => {
    class EmailTemplate extends BaseAsset {
        static get endpoint() {
            return "emailTemplate";
        }

        static async find(searchParams) {
            return await super.find(EmailTemplate.endpoint, searchParams);
        }

        static stream(searchParams) {
            return super.stream(EmailTemplate, searchParams)
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
        //  TODO Review this method and write event emission
        async create(filePath) {
            let fileStream = await fs.createReadStream(filePath);
            let requestConfig = await this.createFormRequestConfig(fileStream, false, "content");

            //  Add our Request URL
            requestConfig.url = `/rest/asset/v1/${EmailTemplate.endpoint}s.json`;

            let createResponse = await this.request(requestConfig);

            return createResponse;
        }
    }

    /**
     * Mixins
     */
    const content = require("./mixins/content");
    const updateTemplateContent = require("./mixins/updateTemplateContent");
    const clone = require("./mixins/clone");
    const drafts = require("./mixins/drafts");
    Object.assign(EmailTemplate.prototype, content, updateTemplateContent, drafts, clone);

    /**
     * Schema definition for Folder Properties
     */
    EmailTemplate.propSchema = BaseAsset.propSchema.shape({
        status: yup.string().oneOf(["Draft", "Approved"]),
        workspace: yup.string(),
    });

    /**
     * Extend Search Schema
     */
    EmailTemplate.searchSchema = BaseAsset.searchSchema.shape({
        status: yup.string().oneOf(["approved", "draft"]),
    });

    return EmailTemplate;
};

module.exports = Spawn;
