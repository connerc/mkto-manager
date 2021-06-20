const test = require("ava");
const { requestScope } = require("../../nock");

const testCredentials = require("../../../config.test");
const mktoManager = require("../../../lib")(testCredentials);

const mockLandingPageRecord = {
	record: {
		id: 27,
		name: "My Cool Landing Page",
		description: "this is a test",
		createdAt: "2016-05-20T18:41:43Z+0000",
		updatedAt: "2016-05-20T18:41:43Z+0000",
		folder: {
			type: "Folder",
			value: 11,
			folderName: "Landing Pages",
		},
		workspace: "Default",
		status: "draft",
		template: 1,
		title: "test create",
		keywords: "awesome",
		robots: "index, nofollow",
		formPrefill: false,
		mobileEnabled: false,
		URL: "https://app-devlocal1.marketo.com/lp/622-LME-718/createLandingPage.html",
		computedUrl: "https://app-devlocal1.marketo.com/#LP27B2",
	},
	get create() {
		return {
			name: this.record.name,
			folder: this.record.folder,
			description: this.record.description,
			template: this.record.template,
			title: this.record.title,
			keywords: this.record.keywords,
		};
	},
};

const LandingPageManager = mktoManager.assets.LandingPage;
//LandingPageManager.on("find_request", config => console.log(config))

//  Get by ID
test("Get Landing Page by ID", async t => {
	requestScope
		.get(`/rest/asset/v1/landingPage/${mockLandingPageRecord.record.id}.json`)
		.query(true)
		.reply(200, {
			success: true,
			result: [mockLandingPageRecord.record],
		});

	const findLandingPageResponse = await LandingPageManager.find({
		id: mockLandingPageRecord.record.id,
	});

	t.true(findLandingPageResponse.success);
	t.is(findLandingPageResponse.getFirst().id, mockLandingPageRecord.record.id);
});

//  Get by name
test("Get Landing Page by name", async t => {
	requestScope
		.get("/rest/asset/v1/landingPage/byName.json")
		.query({ name: mockLandingPageRecord.record.name })
		.reply(200, {
			success: true,
			result: [mockLandingPageRecord.record],
		});

	const findLandingPageResponse = await LandingPageManager.find({
		name: mockLandingPageRecord.record.name,
	});

	t.true(findLandingPageResponse.success);
	t.is(findLandingPageResponse.getFirst().get("name"), mockLandingPageRecord.record.name);
});

//  Get all
test("Get Landing Pages with random max return", async t => {
	const randomMaxReturn = Math.floor(Math.random() * 180) + 1;
	requestScope
		.get("/rest/asset/v1/landingPages.json")
		.query(requestParams => {
			return requestParams.maxReturn == parseInt(requestParams.maxReturn, 10) && requestParams.offset == undefined;
		})
		.reply(200, {
			success: true,
			result: Array(randomMaxReturn).fill(mockLandingPageRecord.record),
		});

	const findLandingPageResponse = await LandingPageManager.find({
		maxReturn: randomMaxReturn,
	});

	t.true(findLandingPageResponse.success);
	t.is(findLandingPageResponse.getAll().length, randomMaxReturn);
});

//  Stream large number of Landing Pages
test("Stream all Landing Pages", async t => {
	const maxOffset = 400;
	const finalRequestMax = 125;
	requestScope
		.get("/rest/asset/v1/landingPages.json")
		//  First 4 requests - will return 200 mocked results
		.times(4)
		.query(requestParams => {
			return requestParams.maxReturn == 200 && requestParams.offset <= 400;
		})
		.reply(200, {
			success: true,
			result: Array(200).fill(mockLandingPageRecord.record),
		})
		//  Final request
		.get("/rest/asset/v1/landingPages.json")
		.query(requestParams => {
			return !!requestParams.maxReturn && requestParams.offset >= 0;
		})
		.reply(200, {
			success: true,
			result: Array(finalRequestMax).fill(mockLandingPageRecord.record),
		});

	const streamHandler = LandingPageManager.stream({
		maxReturn: 200,
	});

	let streamResultsCapture = [];
	let eventCaptureFlag = false;
	// streamHandler.on("find_request", requestConfig => {
	// 	console.log("requestConfig", requestConfig)
	// });
	streamHandler.on("success", mktoResponse => {
		eventCaptureFlag = true;
		//console.log("count", mktoResponse.getAll().length)
		streamResultsCapture.push(...mktoResponse.getAll());
	});
	const streamResults = await streamHandler.run();

	//t.is(streamResults.length, 200 * (maxOffset / 200 + 1) + finalRequestMax);
	t.is(streamResultsCapture.length, 200 * (maxOffset / 200 + 1) + finalRequestMax);
	t.true(eventCaptureFlag);
});

//  Create new Landing Page
test("Create new Landing Page", async t => {
	const randomNewRecordId = Math.floor(Math.random() * 180) + 1;

	requestScope
		.post("/rest/asset/v1/landingPages.json", payload => {
			return payload.name && payload.folder && payload.template;
		})
		.query(true)
		.reply(200, {
			success: true,
			result: [
				{
					...mockLandingPageRecord.record,
					id: randomNewRecordId,
					status: "draft",
				},
			],
		});

	const newLp = new LandingPageManager(mockLandingPageRecord.create);
	newLp.on("create_request", requestConfig => console.log(requestConfig));
	const createLpResponse = await newLp.create();

	t.true(createLpResponse.success);
	t.is(createLpResponse.getFirst().id, randomNewRecordId);
	t.is(createLpResponse.getFirst().get("status"), "draft");
	t.deepEqual(createLpResponse.getFirst().data, {
		...mockLandingPageRecord.record,
		id: randomNewRecordId,
		status: "draft",
	});
});

//  Update Landing Page
test("Update Landing Page", async t => {
	const newDescText = "I am an updated description!";

	const newLp = new LandingPageManager(mockLandingPageRecord.record);
	newLp.set("description", newDescText);
	t.true(newLp.isChanged);

	requestScope
		.post(`/rest/asset/v1/landingPage/${newLp.id}.json`, payload => {
			return payload != undefined;
		})
		.query(true)
		.reply(200, {
			success: true,
			result: [
				{
					id: newLp.id,
				},
			],
		});

	const updateLpResponse = await newLp.update();

	t.true(updateLpResponse.success);
	t.is(updateLpResponse.getFirst().id, newLp.id);
	t.is(newLp.get("description"), newDescText);
});

//  Verify addLog helper adds to the description property after successful update call
test("Test API Log System", async t => {
	const apiLogMessage = new Date().toISOString() + " auto updated asset sources";

	const newLp = new LandingPageManager(mockLandingPageRecord.record);
	newLp.addLog(apiLogMessage);
	t.true(newLp.isChanged);

	requestScope
		.post(`/rest/asset/v1/landingPage/${newLp.id}.json`, payload => {
			return payload != undefined;
		})
		.query(true)
		.reply(200, {
			success: true,
			result: [
				{
					id: newLp.id,
				},
			],
		});

	const updateLpResponse = await newLp.update();

	t.true(updateLpResponse.success);
	t.true(newLp.get("description").indexOf(apiLogMessage) > -1);
});

//  Verify approveDraft call
test("Approve LP Draft", async t => {
	const newLp = new LandingPageManager({
		...mockLandingPageRecord.record,
		status: "draft",
	});

	requestScope
		.post(`/rest/asset/v1/landingPage/${newLp.id}/approveDraft.json`, payload => {
			return true;
		})
		.query(true)
		.reply(200, {
			success: true,
			result: [
				{
					id: newLp.id,
				},
			],
		});

	const updateLpResponse = await newLp.approveDraft();

	t.true(updateLpResponse.success);
	t.is(newLp._data.status, "approved");
});

//  Verify unapprove call
test("Unapprove LP", async t => {
	const newLp = new LandingPageManager({
		...mockLandingPageRecord.record,
		status: "approved",
	});

	requestScope
		.post(`/rest/asset/v1/landingPage/${newLp.id}/unapprove.json`, payload => {
			return true;
		})
		.query(true)
		.reply(200, {
			success: true,
			result: [
				{
					id: newLp.id,
				},
			],
		});

	const updateLpResponse = await newLp.unapprove();

	t.true(updateLpResponse.success);
	t.is(newLp._data.status, "draft");
});

//  Verify unapprove call
test("Discard LP Draft", async t => {
	const newLp = new LandingPageManager({
		...mockLandingPageRecord.record,
		status: "draft",
	});

	requestScope
		.post(`/rest/asset/v1/landingPage/${newLp.id}/discardDraft.json`, payload => {
			return true;
		})
		.query(true)
		.reply(200, {
			success: true,
			result: [
				{
					id: newLp.id,
				},
			],
		});

	const updateLpResponse = await newLp.discardDraft();

	t.true(updateLpResponse.success);
	t.is(newLp._data.status, "approved");
});

//  Verify Delete call
test("Delete LP", async t => {
	const newLp = new LandingPageManager({
		...mockLandingPageRecord.record,
		status: "draft",
	});

	requestScope
		.post(`/rest/asset/v1/landingPage/${newLp.id}/delete.json`, payload => {
			return true;
		})
		.query(true)
		.reply(200, {
			success: true,
			result: [
				{
					id: newLp.id,
				},
			],
		});

	const updateLpResponse = await newLp.delete();

	t.true(updateLpResponse.success);
});

//  Verify Clone
test("Clone LP", async t => {
	const newLp = new LandingPageManager({
		...mockLandingPageRecord.record,
		status: "approved",
	});

	const nextLpId = 1440;
	const newFolder = {
		type: "folder",
		value: 3535,
	};

	requestScope
		.post(`/rest/asset/v1/landingPage/${newLp.id}/clone.json`, payload => {
			return payload.name && payload.folder;
		})
		.query(true)
		.reply(200, {
			success: true,
			result: [
				{
					...newLp.data,
					folder: newFolder,
					name: newLp.get("name") + " 2",
					id: nextLpId,
				},
			],
		});

	const cloneLpResponse = await newLp.clone({
		name: newLp.get("name") + " 2",
		folder: newFolder,
	});

	t.true(cloneLpResponse.success);
	t.is(cloneLpResponse.getFirst().id, nextLpId);
	t.not(cloneLpResponse.getFirst().id, newLp.id);
	t.deepEqual(cloneLpResponse.getFirst().get("folder"), newFolder);
});

//  LP Variables
test("Get LP Variables", async t => {
	const newLp = new LandingPageManager({
		...mockLandingPageRecord.record,
		status: "approved",
	});

	requestScope
		.get(`/rest/asset/v1/landingPage/${newLp.id}/variables.json`)
		.query(true)
		.reply(200, {
			success: true,
			result: [
				{
					id: "stringVar",
					value: "Hello World!",
					type: "string",
				},
				{
					id: "colorVar",
					value: "#FFFFFF",
					type: "color",
				},
				{
					id: "boolVar",
					value: "true",
					type: "boolean",
				},
			],
		});

	const variablesLpResponse = await newLp.getVariables();

	t.true(variablesLpResponse.success);
	t.true(Array.isArray(variablesLpResponse.getAll()));
	t.true(variablesLpResponse.getFirst() instanceof Object);
});

//  LP Variables
test("Update LP Variable", async t => {
	const newLp = new LandingPageManager({
		...mockLandingPageRecord.record,
		status: "approved",
	});

	const lpVariable = {
		id: "colorVar",
		value: "#FFFFFF",
		type: "color",
	};

	requestScope
		.post(`/rest/asset/v1/landingPage/${newLp.id}/variable/${lpVariable.id}.json`, payload => {
			return payload.value;
		})
		.query(true)
		.reply(200, (uri, requestBody) => {
			return {
				success: true,
				result: [
					{
						id: uri.split("/")[uri.split("/").length - 1].replace(".json", ""),
						type: lpVariable.type,
						value: JSON.parse('{"' + requestBody.replace(/&/g, '","').replace(/=/g, '":"') + '"}', function (key, value) {
							return key === "" ? value : decodeURIComponent(value);
						}).value,
					},
				],
			};
		});

	const updateVariableLpResponse = await newLp.updateVariable(lpVariable.id, "newValue");

	t.true(updateVariableLpResponse.success);
	t.is(updateVariableLpResponse.getFirst().value, "newValue");
});

//  LP Get Full Content
test("Get LP HTML Content", async t => {
	const newLp = new LandingPageManager({
		...mockLandingPageRecord.record,
		status: "approved",
	});

	requestScope
		.get(`/rest/asset/v1/landingPage/${newLp.id}/fullContent.json`)
		.query(true)
		.reply(200, (uri, requestBody) => {
			return {
				success: true,
				result: [
					{
						id: uri.split("/")[4].replace(".json", ""),
						content: "<doctype><html>...",
					},
				],
			};
		});

	const getLpContentResponse = await newLp.getFullContent();

	t.true(getLpContentResponse.success);
	t.truthy(!!getLpContentResponse.getFirst().id);
	t.true(getLpContentResponse.getFirst() instanceof Object);
	t.true(getLpContentResponse.getFirst().content.length > 5);
});
