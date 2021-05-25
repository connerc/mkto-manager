const path = require("path");
const BaseAsset = require(path.join(__dirname, "BaseAsset")).BaseAsset;
const MktoResponse = require(path.join(__dirname, "../MktoResponse"));
const yup = require("yup");

const Spawn = (ParentClass = BaseAsset) => {
    class Tag extends ParentClass {
        static get endpoint() {
            return "tagType";
        }

        static async find(searchParams) {
            return await super.find(Tag.endpoint, searchParams)

            //  Build Asset URI with our known prepend
            let url = `/rest/asset/v1/${Tag.endpoint}/byName.json`;
            this.emit("find_request", {
                method: "get",
                url: url,
                params: searchParams,
            });

            //  DEV NOTE: Marketo does not define ALL REST endpoints at /rest/*, so we need to define it on a "case by case" basis. Bad dev decisions, IMO.
            let requestConfig = {
                method: "get",
                url: url,
                params: searchParams,
            };
            let response = await Tag.prototype.REQ.mktoRequest(requestConfig).catch(error => console.log("MktoRequest error", error)); //  TODO - update this error handling here

            this.emit("mkto_request_response", response);

            const mktoResponse = new MktoResponse(response, this);
            this.emit("find_response", mktoResponse);

            return mktoResponse;
        }

        constructor(data) {
            super(data);

            this._protectedProps = [...this._protectedProps];

            //////////////////////
            //  Indv. Asset Props
        }

        /*******************************************
         * Activate ********************************
         *******************************************/
        /**
         * Activate this Smart Campaign
         */
        async getAll() {
            let requestConfig = {
                method: "get",
                url: `${this.assetEndpoint}.json`,
                params: config,
            };
            let response = await this.request(requestConfig);

            return this.makeResponse(response);
        }
    }

    /**
     * Mixins
     */

    /**
     * Schema definition for LandingPage Properties
     */
    Tag.propSchema = BaseAsset.propSchema.shape({
        tags: yup.array(),
        type: yup.string().nullable(),
        channel: yup.string().nullable(),
        costs: yup.string().nullable(),
    });

    /**
     * Extend Search Schema
     */
    Tag.searchSchema = BaseAsset.searchSchema.shape({
        filterType: yup.string().oneOf(["id", "programId", "folderId", "workspace"]),
        earliestUpdatedAt: yup.date(),
        latestUpdatedAt: yup.date(),
    });

    return Tag;
};

module.exports = Spawn;
