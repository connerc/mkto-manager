const path = require("path");
const BaseAsset = require(path.join(__dirname, "BaseAsset")).BaseAsset;
const MktoResponse = require("../MktoResponse");
const yup = require("yup");

const Spawn = (ParentClass = BaseAsset) => {
    class Program extends ParentClass {
        static get endpoint() {
            return "program";
        }

        static async find(searchParams) {
            return await super.find(Program.endpoint, searchParams);
        }

        constructor(data) {
            super(data);

            //  Search Params
            /*
            root: JSON  (Parent Program),
            maxDepth: Int,
            workSpace: String,
            */

            //  Result Properties
            /*
            description: String,
            isArchive: Boolean,
            name: String,
            type: String ['Program', 'Program']
            */

            this._protectedProps = [...this._protectedProps];

            //////////////////////
            //  Indv. Asset Props
        }

        /**
         * Approve the current Program
         * @returns MktoResponse
         */
        async approve() {
            let requestConfig = {
                method: "post",
                url: `${this.assetEndpoint}/approve.json`,
            };

            const approveResponse = this.makeResponse(await this.request(requestConfig));
            this.emit("approve", approveResponse, this);

            return approveResponse;
        }

        /**
         * Unapprove the current Program
         * @returns MktoResponse
         */
        async unapprove() {
            let requestConfig = {
                method: "post",
                url: `${this.assetEndpoint}/unapprove.json`,
            };

            const unapproveResponse = this.makeResponse(await this.request(requestConfig));
            this.emit("unapprove", unapproveResponse, this);

            return unapproveResponse;
        }

        /**
         * Get Program SmartList
         * @returns MktoResponse
         */
        async getSmartList(config = {}) {
            let requestConfig = {
                method: "get",
                url: `${this.assetEndpoint}/smartList.json`,
                params: config,
            };

            const getSmartListResponse = this.makeResponse(await this.request(requestConfig));
            this.emit("get-smart-list", getSmartListResponse, this);

            return getSmartListResponse;
        }

        //////////////////////////////////////////////////////////
        //  From the Lead Database Definitions  ///////////////////
        //////////////////////////////////////////////////////////

        /**
         * Here is another shining example of Marketo REST API Shenanigans!
         * The Program _Asset_ info is defined under the Assets endpoints, however
         * the Program _Member_ info is defined under the Lead endpoints.
         *
         * In my opinion - it makes sense to isolate all Program methods into the same handler instance,
         * which happens to have been started within the Asset controller definitions.
         *
         * The Program vs Program Member endpoints differ like this:
         *
         * Program <Asset>
         * /rest/asset/v1/programs/{programId}.json
         *
         * Program <Members>
         * /rest/v1/programs/{programId}/members.json
         *
         *
         * Ugh.
         *
         * Let's spawn a modified programsEndpoint here to compensate.
         */
        get programsEndpoint() {
            return this.assetEndpoint
                .split("/")
                .map(endpointSegment => {
                    if (endpointSegment === "asset") {
                        return false;
                    }
                    if (endpointSegment === "program") {
                        return "programs";
                    }

                    return endpointSegment;
                })
                .filter(item => item)
                .join("/");
        }

        //  Program Members
        /**
         * Describe the Program Member Custom Object for Programs
         * This is a static method!
         * @returns MktoResponse
         */
        static async describeProgramMemberData() {
            let requestConfig = {
                method: "get",
                url: `/rest/${Program.prototype.AssetApiVersion}/${Program.endpoint}s/members/describe.json`,
            };

            return await Program.prototype.REQ.mktoRequest(requestConfig).then(response => new MktoResponse(response));
        }

        /**
         * Get the Program Members
         * @param {*} config
         * @returns MktoResponse
         */
        async getProgramMembers(config = {}) {
            let requestConfig = {
                method: "get",
                url: `${this.programsEndpoint}/members.json`,
                params: config,
                /*
                config = {
                    filterType: <String>,
                    filterValues: <Comma delim String>,
                    fields: <Comma delim String>,
                    batchSize: <Integer default 300>,
                    nextPageToken: <Integer default 0>,
                }
                */
            };

            const getProgramMembers = this.makeResponse(await this.request(requestConfig));
            this.emit("get-program-members", getProgramMembers, this);

            return getProgramMembers;
        }

        /**
         * Sync PRogram Member status - if a supplied leadId is not a member of the program, they will be added to it
         * @param {*} config
         * @returns
         */
        async syncProgramMemberStatus(config = {}) {
            let requestConfig = {
                method: "post",
                url: `${this.programsEndpoint}/members/status.json`,
                data: config,
                /*
                config = {
                    statusName: <String>, Program member status,
                    input: <Array> List of input records (leadId)
                }
                */
            };

            const syncProgramMembers = this.makeResponse(await this.request(requestConfig));
            this.emit("sync-program-member-status", syncProgramMembers, this);

            return syncProgramMembers;
        }

        /**
         * Update the data for EXISTIING Program Members
         * @returns
         */
        async syncProgramMemberData(config = {}) {
            let requestConfig = {
                method: "post",
                url: `${this.programsEndpoint}/members.json`,
                data: config,
                /*
                config = {
                    leadId: <Integer, mkto lead ID>,
                    fieldApiName,
                    fieldApiName2
                }
                */
            };

            const syncProgramMembers = this.makeResponse(await this.request(requestConfig));
            this.emit("sync-program-member-data", syncProgramMembers, this);

            return syncProgramMembers;
        }

        /**
         * Delete a member from the Program Member list
         * @param {*} leadId
         * @returns
         */
        async deleteProgramMember(leadId) {
            let requestConfig = {
                method: "post",
                url: `${this.assetEndpoint}/members/delete.json`,
                data: {
                    leadId: leadId,
                },
            };

            const deleteProgramMember = this.makeResponse(await this.request(requestConfig));
            this.emit("delete-program-member", deleteProgramMember, this);

            return deleteProgramMember;
        }
    }

    /**
     * Mixins
     */
    const cloneMixin = require("./mixins/clone");
    const deleteMixin = require("./mixins/delete");
    Object.assign(Program.prototype, cloneMixin, deleteMixin);

    /**
     * Schema definition for LandingPage Properties
     */
    Program.propSchema = BaseAsset.propSchema.shape({
        tags: yup.array(),
        type: yup.string().nullable(),
        channel: yup.string().nullable(),
        costs: yup.string().nullable(),
    });

    /**
     * Extend Search Schema
     */
    Program.searchSchema = BaseAsset.searchSchema.shape({
        filterType: yup.string().oneOf(["id", "programId", "folderId", "workspace"]),
        earliestUpdatedAt: yup.date(),
        latestUpdatedAt: yup.date(),
    });

    return Program;
};

module.exports = Spawn;
