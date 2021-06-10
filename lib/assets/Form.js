const path = require("path");
//const BaseAsset = require(path.join(__dirname, "BaseAsset")).BaseAsset;
const yup = require("yup");

const Spawn = (BaseAsset) => {
    class Form extends BaseAsset {
        static get endpoint() {
            return "form";
        }

        static async find(searchParams) {
            return await super.find(Form.endpoint, searchParams);
        }

        static stream(searchParams) {
            return super.stream(Form, searchParams)
        }

        static async getFields(config) {
            let _default = { maxReturn: 200, offset: 0 };
            config = {
                ..._default,
                ...config,
            };

            return await super.get(`${Form.endpoint}/field`, config);
        }

        constructor(data) {
            super(data);

            //  No protected Props
        }

        async getThankYou(params) {
            let requestConfig = {
                method: "get",
                url: `${this.assetEndpoint}/thankYouPage.json`,
                params: params,
            };
            const getThankYouResponse = this.makeResponse(await this.request(requestConfig));
            this.emit("get-thank-you", getThankYouResponse, this);

            return getThankYouResponse;
        }

        /**
         * Set one or more new Role entry for this user
         */
        async updateThankYou(config) {
            /*AddRolesRequest {
                input (Array[UserRoleWorkspaceId]): List of roles to add
            }
            UserRoleWorkspaceId {
                accessRoleId (integer): User role id ,
                workspaceId (integer): User workspace id
            }*/
            let requestConfig = {
                method: "post",
                url: `${this.assetEndpoint}/thankYouPage.json`,
                params: config,
            };
            const updateThankYouResponse = this.makeResponse(await this.request(requestConfig));
            this.emit("update-thank-you", updateThankYouResponse, this);

            return updateThankYouResponse;
        }

        /**
         * Retrieve Fields for this Form Instance
         */
        async getFields(config) {
            let _default = { maxReturn: 200, offset: 0 };
            config = {
                ..._default,
                ...config,
            };

            let requestConfig = {
                method: "get",
                url: `${this.assetEndpoint}/fields.json`,
                params: config,
            };
            const getFormFieldsResponse = this.makeResponse(await this.request(requestConfig), Object);
            this.emit("get-form-fields", getFormFieldsResponse, this);

            return getFormFieldsResponse;
        }

        /**
         * Update Field for this Form Instance
         */
        async updateField(fieldId, payload) {
            //  Because this Marketo API Request is form-urlencoded, we need to process specific payload values to fit Marketo's requested data format
            if (payload.values) {
                payload.values = JSON.stringify(payload.values);
            }

            let requestConfig = {
                method: "post",
                url: `${this.assetEndpoint}/field/${fieldId}.json`,
                //  QueryString encode the incoming (processed) payload data for the form-urlencoded request content-type
                data: qs.stringify(payload),
                headers: {
                    Authorization: `Bearer ${this.REQ.apiAuthToken.access_token}`, //  TODO: Find a way to omit the Auth token reference here and rely on original def
                    "content-type": "application/x-www-form-urlencoded; charset=utf-8",
                },
            };

            const updateFormFieldResponse = this.makeResponse(await this.request(requestConfig), Object);
            this.emit("update-form-field", updateFormFieldResponse, this);

            return updateFormFieldResponse;
        }
    }

    /**
     * Schema definition for LandingPage Properties
     */
    Form.propSchema = BaseAsset.propSchema.shape({
        URL: yup.string().url().nullable(),
        computedUrl: yup.string().url().nullable(),

        theme: yup.string(),
        language: yup.string(),
        locale: yup.string(),
        progressiveProfiling: yup.boolean(),
        labelPosition: yup.string(),
        fontFamily: yup.string(),
        fontSize: yup.string(),

        knownVisitor: yup.object({
            type: yup.string(),
            template: yup.string().nullable(),
        }),
        thankYouList: yup.array(),
        // thankYouList: [
        //     {
        //         "followupType": "none",
        //         "followupValue": null,
        //         "default": true
        //     }
        // ],
        buttonLocation: yup.number().integer(),
        buttonLabel: yup.string(),
        waitingLabel: yup.string(),
    });

    //  Extend Search Schema
    Form.searchSchema = BaseAsset.searchSchema.shape({
        status: yup.string().oneOf(["approved", "draft"]),
    });

    const clone = require("./mixins/clone");
    const drafts = require("./mixins/drafts");
    Object.assign(Form.prototype, drafts, clone);

    Form.prototype.unapprove = null; //  Form does NOT use the unapprove method, weirdly

    return Form;
};

module.exports = Spawn;
