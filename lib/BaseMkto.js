const yup = require("yup");
const deepEqual = require("deep-equal");
const FormData = require("form-data");

/**
 * Define the BaseMkto class to create base for all Asset Active Record pattern handlers
 */
module.exports = function ({ mktoRequest, MktoResponse, Emitter }) {
	class BaseMkto {
		/**
		 * Static API Query method with smart search criteria building.
		 * `createSearchParams` method will modify the Endpoint and Query String
		 * to deliver the most targeted search based on the search params provided.
		 * Meant to be extended by child classes.
		 * @param {String} endpoint
		 * @param {Object} searchParams
		 */
		static async find(endpoint, searchParams) {
			/**
			 * DEV NOTE: Marketo does not define ALL REST endpoints at /rest/*,
			 * so we need to define it on a "case by case" basis.
			 * Bad dev decisions by Marketo, IMO.
			 */
			const requestConfig = {
				//  Build Asset URI with our known prepend
				url: mktoRequest.createSearchParams(endpoint, searchParams),
				method: "get",
				params: searchParams,
			};
			this.emit("find_request", requestConfig);

			return mktoRequest
				.request(requestConfig)
				.then(response => {
					const mktoResponse = new MktoResponse(response, this);
					this.emit("find_response", mktoResponse);

					return mktoResponse;
				})
				.catch(error => {
					console.error("MktoRequest error", error);
					this.emit("find_error", error);

					return error;
				});
		}

		/**
		 * Retrieve all Marketo API Records with repeated find() requests
		 * @param {BaseMkto} Handler
		 * @param {Object} searchParams
		 * @returns Array of instantiated Handler API results
		 */
		static stream(Handler, searchParams = {}) {
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
					Handler.on("find_request", reqConfig => {
						this.emit("find_request", reqConfig);
					});

					//  Fire the find request
					const assetFindResponse = await Handler.find(params);

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
		}

		//  Validate against a locally stored schema by schema prop name
		static async checkSchema(schema, value) {
			if (!schema) return false;

			return await schema.validate(value);
		}

		/********************
		 * Init **********
		 ********************/
		constructor(data) {
			//  This gets redefined for each class that extends this instance of BaseMkto
			this.endpoint = "BaseMkto";

			//  Instantiate as Event Emitter instance
			Emitter(this);

			//  Shared MktoRequest Instance
			this.mktoRequest = mktoRequest;

			//  Create a local data store and a previous instance reference to track non-committed changes
			//this.data = JSON.parse(JSON.stringify(data));
			this.data = { ...data };
			this.cacheData();

			//  Required props for create
			this._createRequiredProps = []; //  TODO: finish this out

			//  Internal Props for creating FormData if we need to spawn FormData
			this._formData = {
				name: this.get("name").toString(),
				description: !!this.get("description") ? this.get("description").toString() : "",
				folder: JSON.stringify(this.get("folder")).trim(),
			};

			//  Protected, server only properties - do not allow the set method to modify
			this._protectedProps = ["id", "createdAt", "updatedAt", "url"];
		}

		/********************
		 * Getters **********
		 ********************/
		get id() {
			return this.data.id;
		}

		//  Create a computed prop for detecting non-committed changes
		get isChanged() {
			return !deepEqual(this._data, this.data);
		}

		//  Create a computed prop for displaying currently un-saved (at the API) data
		get changedData() {
			let changedData = {};
			Object.keys(this.data).forEach(dataProp => {
				if (deepEqual(this.data[dataProp], this._data[dataProp]) === false) {
					changedData[dataProp] = this.data[dataProp];
				}
			});

			return changedData;
		}

		//  Determine the specific data properties that have been updated
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
			// for (let prop in this.data) {
			// 	if (this.data.hasOwnProperty(prop)) {
			// 		if (this._protectedProps.indexOf(prop) == -1) {
			// 		//if (!this._protectedProps[prop]) {
			// 			_createData[prop] = this.data[prop];
			// 		}
			// 	}
			// }

			return this.data;
		}

		/********************
		 * Helpers **********
		 ********************/
		//  "Cache" the data property to preserve or save the current state
		cacheData() {
			//this._data = JSON.parse(JSON.stringify(this.data));
			this._data = { ...this.data };
		}

		//  Safely retrieve a data property
		get(prop) {
			return typeof this.data[prop] != "undefined" ? this.data[prop] : false;
		}

		//  Safely set a new data property value
		set(prop, value) {
			if (this._protectedProps.indexOf(prop) == -1) {
				this.data[prop] = value;
			}
		}

		//  Spawn a Mkto Response Object from the response
		makeResponse(resp, InitType = undefined) {
			return new MktoResponse(resp, InitType);
		}

        //  Special Query String prep of common Marketo POST Payloads
        preparePayload(payload) {
            let queryString = []
            Object.keys(payload).forEach(payloadKey => {
                let payloadValue = payload[payloadKey]

                payloadValue = payloadValue instanceof Object ? JSON.stringify(payloadValue) : encodeURIComponent(payloadValue)
                queryString.push(payloadKey + "=" + payloadValue)
            })

            return queryString.join("&")
        }

		/*********************
		 * Form Data Request *
		 *********************/
		async buildFormData(fileStream = false) {
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
			const formData = await this.buildFormData(fileStream);

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
		async request(requestConfig) {
			return await this.mktoRequest.request(requestConfig);
		}
	}

	//  Instantiate Emitter capabilities on the BaseMkto Class
	Emitter(BaseMkto);

	/**
	 * Schema definition for Global Asset Properties - TODO - Finish this
	 */
	BaseMkto.propSchema = yup.object().shape({
		id: yup.number().integer().required("ID is required"),
		name: yup.string().required(),

		url: yup.string().url().nullable(),
		folder: yup.object({
			id: yup.number().integer(),
			type: yup.string().oneOf(["Folder", "Program"]),
		}),
		//  TODO - Correct this incorrect date validation
		// createdAt: yup.date().default(() => null),
		// updatedAt: yup.date().default(() => null),
	});

	/**
	 * Yup validation schema for our standard Search properties for Assets
	 */
	BaseMkto.searchSchema = yup.object().shape({
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

    BaseMkto.prototype.mktoRequest = mktoRequest;

	return BaseMkto;
};
