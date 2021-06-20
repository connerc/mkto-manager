const yup = require("yup");
const FormData = require("form-data");
const MktoResponse = require("../MktoResponse");
/**
 * Define the BaseAsset class to create base for all Asset Active Record pattern handlers
 */
module.exports = function ({ BaseMkto, AssetApiVersion, Emitter }) {
	class BaseAsset extends BaseMkto {
		/**
		 * Static API Query method with smart search criteria building.
		 * `createSearchParams` method will modify the Endpoint and Query String
		 * to deliver the most targeted search based on the search params provided.
		 * Meant to be extended by child classes.
		 * @param {String} endpoint
		 * @param {Object} searchParams
		 */
		static async find(endpoint, searchParams) {
			return super.find(`/rest/asset/${AssetApiVersion}/${endpoint}`, searchParams);
		}

		static async stream(AssetHandler, searchParams) {
			return super.stream(AssetHandler, searchParams);
		}

		/*
        //  Validate against a locally stored schema by schema prop name
        static async checkSchema(schema, value) {
            if (!schema) return false;

            return await schema.validate(value);
        }
        */

		/********************
		 * Init **********
		 ********************/
		constructor(data) {
			super(data);

			this.endpoint = "baseAsset";

			this._protectedProps = ["id", "createdAt", "updatedAt"];
		}

		/********************
		 * Getters **********
		 ********************/

		//  We use Object.getPrototypeOf(this).constructor.endpoint to get a reference to the _local_ static property
		//  Otherwise, all inherited instances would still point to the `BaseAsset.endpoint` instead of their own static property
		//  Yay EcmaScript! lol
		get createAssetEndpoint() {
			return `/rest/asset/${AssetApiVersion}/${Object.getPrototypeOf(this).constructor.endpoint}s`;
		}
		//  Retrieve the unique Asset Endpoint to operate at
		get assetEndpoint() {
			return `/rest/asset/${AssetApiVersion}/${Object.getPrototypeOf(this).constructor.endpoint}/${this.id}`;
		}

		/********************
		 * Helpers **********
		 ********************/
		//  Spawn a Mkto Response Object from the response
		makeResponse(resp, InitType = undefined) {
			return new MktoResponse(resp, InitType);
		}

		/********************
		 * Methods **********
		 ********************/
		async buildFormData(fileStream = false, fileName = false, fileKey = false) {
			//  Create a FormData instance to carry our new File Content data
			let formData = new FormData();

			if (!!fileStream) {
				//  TODO: Review filekey and filename properties here, may differ from LandingPageTemplate to File to EmailTemplate, etc
				await formData.append("content", fileStream, {
					filename: this.get("name") + ".html",
					contentType: "text/plain",
				});
			}

			await Promise.all(
				Object.keys(this._formData).map(configKey => {
					return formData.append(configKey, this._formData[configKey]);
				})
			);

			return formData;
		}

		/**
		 * Creates initial formData POST request config for Marketo form-data submission.
		 * This config must also modify the traditional headers to set the new content-type and filename
		 *
		 * @param {*} param - Pass object with either declared filePath, fileRemoteUrl, or fileStream
		 * @param {*} fileName
		 *
		 * returns object of Request Config
		 */
		async createFormRequestConfig(fileStream = false, fileName = "content", fileKey = "content") {
			//  Build the Form Data Object with our filestream and optional custom key
			let formData = await this.buildFormData(fileStream, fileName, fileKey);

			//  Verify our Request system has an Auth Token
			await this.mktoRequest.getAuthToken();

			//  Return a full request-ready config with content-type and Auth headers set
			return {
				method: "post",
				data: formData,
				// `headers` are custom headers to be sent
				headers: {
					Accept: `application/json`,
					Authorization: `Bearer ${this.mktoRequest.apiAuthToken.access_token}`,
					...formData.getHeaders(),
				},
			};
		}

		/***********************************
		 * Requesters **********************
		 ***********************************/
		//  Send a HTTP Request with full custom request Config
		// async request(requestConfig) {
		//     return await this.mktoRequest.request(requestConfig);
		// }

		//  Method for sending Create requests to the API
		//  TODO - Finish and test this system!
		async create() {
			//  TODO create validation here against this._createRequiredProps

			let requestConfig = {
				method: "post",
				headers: {
					"content-type": "application/x-www-form-urlencoded",
				},
				url: `${this.createAssetEndpoint}.json`,
				data: this.preparePayload(this.createData), //  Omits our protected data which the server assigns, like `id` and `createdAt`
			};
			//console.log(requestConfig);
			this.emit("create_request", requestConfig, this);

			const createResponse = this.makeResponse(await this.request(requestConfig), this.constructor);
			this.emit("create_response", createResponse, this);

			//  In code logic, use toBoolean against the returned createResponse to check if the create request was successful,
			//  and the use the MktoResponse helper method `response.getFirst()` to retrieve the new instantiated version of this Asset
			//  that will contain all data from Marketo

			//  Return the createResponse
			return createResponse;
		}

		/**
		 * Update the Asset using the content from the data prop
		 */
		async update() {
			let requestConfig = {
				method: "post",
				url: `${this.assetEndpoint}.json`,
				data: this.changedData,
			};

			const updateResponse = this.makeResponse(await this.request(requestConfig));

			//  Update this objects data store
			if (updateResponse) {
				this.cacheData();
			}
			this.emit("update", updateResponse, this);

			return updateResponse;
		}
	}

	/**
	 * Constants
	 */
	//  Define the API Version "id" for specifically the Asset Endpoints.
	//const AssetApiVersion = "v1";
	BaseAsset.prototype.AssetApiVersion = AssetApiVersion;
	//BaseAsset.prototype.AssetApiVersion = "v1";

	/**
	 * Proto definitions
	 */
	//  Instantiate Emitter capabilities on the BaseAsset Class
	Emitter(BaseAsset);

	/**
	 * Static Asset GET Request. Because this method is static, we must reference the `MktoRequest` mtoReq instance directly instead of the Class stored copy (this.REQ)
	 *
	 * This method takes in searchParams, and will auto generate the necessary Asset specific endpoint.
	 * Returned data is validated and returned as a MktoResponse instance.
	 * The MktoResponse class is passed the current Class (this) to instantiate all API results as Assets.
	 *
	 * ## Example:
	 * _LandingPage extends BaseAsset_
	 *
	 * let lpSearch = LandingPage.get({ name: 'ToasterOvenLandingPage' })
	 * let toasterOvenLp = lpSearch.getFirst()
	 *
	 * (toasterOvenLp instanceof LandingPage) === true!
	 *
	 *
	 * @param {*} endpoint
	 * @param {*} searchParams
	 */
	/*
	BaseAsset.find = async function (endpoint, searchParams) {
		//  Build Asset URI with our known prepend
		let url = mtoReq.createSearchParams(`/rest/asset/${AssetApiVersion}/${endpoint}`, searchParams);
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
		let response = await mtoReq.mktoRequest(requestConfig).catch(error => console.log("MktoRequest error", error)); //  TODO - update this error handling here

		this.emit("mkto_request_response", response);

		const mktoResponse = new MktoResponse(response, this);
		this.emit("find_response", mktoResponse);

		return mktoResponse;

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
	//};

	/**
	 * Retrieve all Marketo Assets with repeated find() requests
	 * @param {BaseAsset} AssetHandler
	 * @param {Object} searchParams
	 * @returns Array of instantiated AssetHandler API results
	 */
	BaseAsset.stream = function (AssetHandler, searchParams = {}) {
		let streamHandler = {};
		Emitter(streamHandler);

		streamHandler = {
			...streamHandler,
			//
			initialSearchParams: searchParams,
			data: [],
			errors: [],
			async retrieveRecords(params = {}) {
				//  Extend our incoming default params
				params = {
					maxReturn: 200,
					...params,
					offset: params.offset || 0,
				};

				//  Set our initial listeners
				AssetHandler.on("find_request", reqConfig => {
					this.emit("find_request", reqConfig);
				});

				//  Fire the find request
				const assetFindResponse = await AssetHandler.find(params);

				if (assetFindResponse.success) {
					this.emit("request_success", assetFindResponse);
					this.emit("success", assetFindResponse);

					//  Record our incoming instantiated assets
					this.data.push(...assetFindResponse.data);

					// Check if we need to retrieve more records
					if (assetFindResponse.data.length === params.maxReturn) {
						//  Call yourself again
						//  This new instance of retrieveRecords will take care of adding its own records to this.data
						await this.retrieveRecords({
							...params,
							offset: params.offset + params.maxReturn,
						});
					}
				} else if (!assetFindResponse.success) {
					this.emit("request_mkto_error", assetFindResponse);
				} else if (assetFindResponse.status != 200) {
					this.emit("request_http_error", assetFindResponse);
				} else {
					this.emit("error", this);
				}

				return this.data;
			},
			async run() {
				return this.retrieveRecords(searchParams).then(data => {
					this.emit("finished", this);
					return data;
				});
			},
		};

		return streamHandler;
	};

	/**
	 * Schema definition for Global Asset Properties - TODO - Finish this
	 */
	BaseAsset.propSchema = yup.object().shape({
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
	BaseAsset.searchSchema = yup.object().shape({
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

	return BaseAsset;
};
