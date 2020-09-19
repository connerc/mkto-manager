const yup = require("yup");
var deepEqual = require("deep-equal");
const MktoResponse = require("./MktoResponse");

class User {
    /********************
     * Init **********
     ********************/
    constructor(data) {
        //  Store the ID in a top level prop for easier reference
        if (data.id) {
            this.id = data.id;
            //  User endpoints refer to the id as userid - it is in fact the emailAddress - traditionally
            this.userid = data.userid;
        }
        //  Create a local data store and a previous instance reference to track non-committed changes
        this.data = JSON.parse(JSON.stringify(data));
        this.cacheData();

        //  Required props for create
        this._createRequiredProps = []; //  TODO: finish this out

        //  Protected, server only properties - do not allow the set method to modify
        this._protectedProps = ["id", "createdAt", "updatedAt", "url"];
    }

    static init(documentData) {
        ///////////////////////////////////
        //  Because we instantiate from MongoDB Documents,
        //  lets clean up some Mongo specific props that get passed here
        const mongoPropCleanup = ["_id", "__v"];
        mongoPropCleanup.forEach(cleanProp => {
            if (typeof documentData[cleanProp] !== "undefined") delete documentData[cleanProp];
        });
        ///////////////////////////////////

        return new this(documentData);
    }

    /********************
     * Getters **********
     ********************/
    //  Create a computed prop for detecting non-committed changes
    get isChanged() {
        //return (this._data == this.data) === false
        return !deepEqual(this._data, this.data);
    }

    //  Create a computed prop for displaying currently un-saved data
    get changedData() {
        let changedData = {};
        Object.keys(this.data).forEach(dataProp => {
            if (deepEqual(this.data[dataProp], this._data[dataProp]) === false) {
                changedData[dataProp] = this.data[dataProp];
            }
        });

        return changedData;
    }

    //  Determine the specific properties that have been updated
    get updatedData() {
        let _updatedData = {};
        for (let prop in this.data) {
            if (this.data.hasOwnProperty(prop)) {
                if (JSON.stringify(this.data[prop]) != JSON.stringify(this._data[prop])) {
                    _updatedData[prop] = this.data[prop];
                }
            }
        }

        return _updatedData;
    }

    //  Filter down data to depict only the properties for record creation
    get createData() {
        let _createData = {};
        for (let prop in this.data) {
            if (this.data.hasOwnProperty(prop)) {
                if (!this._protectedProps[prop]) {
                    _createData[prop] = this.data[prop];
                }
            }
        }

        return _createData;
    }

    get assetEndpoint() {
        //  We use Object.getPrototypeOf(this).constructor.endpoint to get a reference to the _local_ static property
        //  Otherwise, all inherited instances would still point to the `User.endpoint` instead of their own static property
        //  Yay EcmaScript! lol
        return `/userservice/management/${AssetApiVersion}/users/${this.id}`;
    }

    /********************
     * Helpers **********
     ********************/
    cacheData() {
        this._data = JSON.parse(JSON.stringify(this.data));
    }

    //  Safely retrieve a data property
    get(prop) {
        if (typeof this.data[prop] != "undefined") {
            return this.data[prop];
        }

        return false;
    }

    //  Safely set a new data property value
    set(prop, value) {
        if (this._protectedProps.indexOf(prop) == -1) {
            this.data[prop] = value;
        }
    }

    //  Spawn a Mkto Response Object from the response
    makeResponse(resp, InitType = undefined) {
        return new MktoUserResponse(resp, InitType);
    }

    /********************
     * Methods **********
     ********************/
    //  Send a HTTP Request with full custom request Config
    async request(requestConfig) {
        return await this.REQ.mktoRequest(requestConfig);
    }

    //  Method for sending Create requests to the API
    //  TODO - Finish and test this system!
    async create() {
        //  TODO create validation here against this._createRequiredProps

        let requestConfig = {
            method: "post",
            url: `${this.assetEndpoint}.json`,
            params: this.createData, //  Omits our protected data which the server assigns, like `id` and `createdAt`
        };
        console.log("  |  Create Config", requestConfig);
        let response = await this.request(requestConfig);

        let createResponse = new MktoUserResponse(response, this);

        //  In code logic, use toBoolean against the returned createResponse to check if the create request was successfull,
        //  and the use the MktoREsponse helper method `response.getFirst()` to retrieve the new instantiated version of this Asset
        //  that will contain all data from Marketo

        //  Return the createResponse
        return createResponse;
    }

    /**
     * Update the User using the content from the data prop
     */
    async update() {
        /*UpdateUserAttributesRequest {
            apiOnly (boolean, optional): Whether the user is API-Only. Default is false ,
            emailAddress (string, optional): User email address ,
            expiresAt (string, optional): Date and time when user login expires. Example: yyyy-MM-dd'T'HH:mm:ss.SSS't'Z ,
            firstName (string, optional): User first name ,
            lastName (string, optional): User last name
        }*/
        let requestConfig = {
            method: "post",
            url: `${this.assetEndpoint}/update.json`,
            params: this.changedData,
        };
        //console.log('  |  Update Config', requestConfig)
        let response = await this.request(requestConfig);
        let updateResponse = new MktoUserResponse(response, this);

        if (updateResponse) {
            //  Update this objects data store
            this.cacheData();
        }

        return updateResponse;
    }

    /**
     * Delete the User record
     */
    async delete() {
        let requestConfig = {
            method: "post",
            url: `${this.assetEndpoint}/delete.json`,
        };
        //console.log('  |  Update Config', requestConfig)
        let response = await this.request(requestConfig);
        let updateResponse = new MktoUserResponse(response, this);

        if (updateResponse) {
            //  Update this objects data store
            this.cacheData();
        }

        return updateResponse;
    }

    /**
     * Retrieve Roles for this User
     */
    async getRoles() {
        let requestConfig = {
            method: "get",
            url: `${this.assetEndpoint}/roles.json`,
        };
        let response = await this.request(requestConfig);

        return this.makeResponse(response);
    }

    /**
     * Set one or more new Role entry for this user
     */
    async createRoles(config) {
        /*AddRolesRequest {
            input (Array[UserRoleWorkspaceId]): List of roles to add
        }
        UserRoleWorkspaceId {
            accessRoleId (integer): User role id ,
            workspaceId (integer): User workspace id
        }*/
        let requestConfig = {
            method: "post",
            url: `${this.assetEndpoint}/roles/create.json`,
            params: config,
        };
        let response = await this.request(requestConfig);

        return this.makeResponse(response);
    }

    /**
     * Delete on or more Role Entries for a User
     */
    async deleteRoles(config) {
        /*AddRolesRequest {
            input (Array[UserRoleWorkspaceId]): List of roles to add
        }
        UserRoleWorkspaceId {
            accessRoleId (integer): User role id ,
            workspaceId (integer): User workspace id
        }*/
        let requestConfig = {
            method: "post",
            url: `${this.assetEndpoint}/roles/delete.json`,
            params: config,
        };
        let response = await this.request(requestConfig);

        return this.makeResponse(response);
    }

    //  Validate against a locally stored schema by schema prop name
    static async checkSchema(schema, value) {
        if (!schema) return false;

        return await schema.validate(value);
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Create a unique MktoResponse Class for handling User Response
//  Extend the Core MktoResponse class
class MktoUserResponse extends MktoResponse {
    constructor(response, ResultClass) {
        super(response, ResultClass)
    }

    /**
     * Computed Properties
     */
    //  Marketo User Request Success - No Success prop in the data response
    get success() {
        //  201 for User Invite requests, all others are 200
        return this._res.status == 200 || 201 ? true : false;
    }
    //  Raw Marketo Result Array
    get result() {
        return !!this._data ? this._data : {};
    }

    //  Reference to all results as ResultClass instances
    get data() {
        if (!this.result) return {};

        if (Array.isArray(this._data)) {
            return this.result.map(apiRecord => this.createAsset(apiRecord));
        } else {
            return [this.createAsset(this.result)];
        }
    }

    //  Get either first Array result, OR get the entire data object if not an array
    getFirst() {
        if (Array.isArray(this.data)) {
            return this.data[0] ? this.data[0] : false;
        }

        return this.data;
    }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Initialization Handler
 * Use this method to instantiate User with a previously instantiated instance of MktoRequest
 * @param {MktoRequest} mtoReq
 */
const init = function (mtoReq) {
    /**
     * Constants
     */
    //  Define the API Version "id" for specifically the Asset Endpoints.
    const AssetApiVersion = "v1";

    /**
     * Proto definitions
     */
    //  Static - Define our endpoint default.
    //  This gets redefined for each class that extends this instance of User
    User.prototype.endpoint = "/userservice/management";

    //  Store a local reference to the instantiated MktoRequest (mtoReq) instance for User+ additional Active Record pattern methods
    User.prototype.REQ = mtoReq;

    /**
     *
     * @param {*} searchParams
     */
    User.find = async function (searchParams = {}) {
        /*searchParams = {
            //  Standard Searchhing
            pageOffset : <int> 0,
            pageSize : <int> 20, [max 200],
        }*/
        let url = `${User.prototype.endpoint}/${AssetApiVersion}/users/`;
        if (searchParams.hasOwnProperty("id")) {
            url += `${searchParams.id}/user.json`;
        } else {
            url += `allusers.json`;
        }
        //  DEV NOTE: Marketo does not define ALL REST endpoints at /rest/*, so we need to define it on a "case by case" basis. Bad dev decisions, IMO.

        let response = await mtoReq
            .mktoRequest({
                method: "get",
                url: url,
                params: searchParams,
            })
            .catch(error => console.log("MktoRequest error", error)); //  TODO - update this error handling here

        return new MktoUserResponse(response, User);

        /* Example Axios.data response = {
            status: 200,
            statusText: 'OK',
            data: {
                success: true,
                errors: [],  //  If success === false
                requestId: '10feb#16e26d4997c',
                warnings: [],
                result: [  //  If success === true
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object]
                ]
            }
        }*/
    };


    /**
     * Find an Invited (Pending) User By ID
     */
    User.findInvited = async function (searchParams = {}) {
        /*searchParams = {
            id: String
        }*/

        if(searchParams.id === undefined) {
            //  TODO Throw Exception or return an error response - must had user ID string
            return false
        }


        let response = await mtoReq
            .mktoRequest({
                method: "get",
                url: `${User.prototype.endpoint}/${AssetApiVersion}/users/${searchParams.id}/invite.json`,
                params: searchParams,
            })
            .catch(error => console.log("MktoRequest error", error)); //  TODO - update this error handling here

        return new MktoUserResponse(response, this);

        /* Example Axios.data response = {
            status: 200,
            statusText: 'OK',
            data: {
                success: true,
                errors: [],  //  If success === false
                requestId: '10feb#16e26d4997c',
                warnings: [],
                result: [  //  If success === true
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object], [Object], [Object],
                [Object]
                ]
            }
        }*/
    };

    /**
     * Retrieve All defined User Roles
     */
    User.roles = async function (searchParams = {}) {
        let userRolesUrl = `${User.prototype.endpoint}/${AssetApiVersion}/users/roles.json`;

        //  Specific User Roles & Workspaces can be retrieved statically without instantiated instance of the User
        //  See notes inside Users.workspaces static method for more info
        if (!!searchParams.id) {
            userRolesUrl = `${User.prototype.endpoint}/${AssetApiVersion}/users/${searchParams.id}/roles.json`;

            //  Passing a User ID and statically retrieving Roles for a User will ALSO return Workspaces
        }

        let requestConfig = {
            method: "get",
            url: userRolesUrl,
        };
        let response = await mtoReq.mktoRequest(requestConfig);
        return new MktoUserResponse(response);
    };

    /**
     * Retrieve All defined User Roles
     */
    User.workspaces = async function () {
        /*
            Now technically, if this followed the same standard as it's sister method `roles` above, we should be able to
            send a user ID value here to get just workspace results for just that user, BUT NO!
            Marketo decided that the `/users/{id}/roles.json` endpoint will return both Roles and Workspaces together,
            and that the `/users/{id}/workspaces.json` endpoint does not exist.
            ¯\_(ツ)_/¯
        */
        let userWorkspacesUrl = `${User.prototype.endpoint}/${AssetApiVersion}/users/workspaces.json`;
        let requestConfig = {
            method: "get",
            url: userWorkspacesUrl,
        };
        let response = await mtoReq.mktoRequest(requestConfig);
        return new MktoUserResponse(response);
    };

    /**
     * Invite a New User, or spawn a new API User
     */
    User.invite = async function (config) {
        /*InviteUserRequest {
            apiOnly (boolean, optional): Whether the user is API-Only. Default is false ,
            emailAddress (string): User email address ,
            expiresAt (string, optional): Date and time when user login expires. Example: yyyy-MM-dd'T'HH:mm:ss.SSS't'Z ,
            firstName (string): User first name ,
            lastName (string): User last name ,
            userid (string, optional): User id in the form of an email address. If not specified, the emailAddress value is used ,
            reason (string, optional): Reason for user invitation ,
            userRoleWorkspaces (Array[UserRoleWorkspaceId])
        }
            
        UserRoleWorkspaceId {
            accessRoleId (integer): User role id ,
            workspaceId (integer): User workspace id
        }*/
        let requestConfig = {
            method: "post",
            url: `${User.prototype.endpoint}/${AssetApiVersion}/users/invite.json`,
            params: config,
        };
        let response = await mtoReq.mktoRequest(requestConfig);
        return new MktoUserResponse(response);
    };

    /**
     * Schema definition for Global Asset Properties - TODO - Finish this
     */
    User.propSchema = yup.object().shape({
        id: yup.number().integer().required("ID is required"),
        name: yup.string().required(),

        url: yup.string().url().nullable(),
        folder: yup.object({
            id: yup.number().integer(),
            type: yup.string().oneOf(["Folder", "Program"]),
        }),
        //  TODO - Correct this incorrect date validation
        // createdAt: yup.date().default(function () {
        //     return new Date();
        // }),
        // updatedAt: yup.date().default(function () {
        //     return new Date();
        // }),
    });

    /**
     * Yup validation schema for our standard Search properties for Assets
     */
    User.searchSchema = yup.object().shape({
        id: yup.number().integer(),
        name: yup.string(),
        maxReturn: yup.number().integer().min(1).max(200),
        offset: yup.number().integer().min(0),
        folder: yup.object({
            id: yup.number().integer(),
            type: yup.string().oneOf(["Folder", "Program"]),
        }),
        workspace: yup.string(),
    });

    return User;
};

module.exports = {
    init: init,
    User: User,
};
