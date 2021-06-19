const test = require("ava");
const nockScope = require("../../nock");

const testCredentials = require("../../../config.test");
const mktoManager = require("../../../lib")(testCredentials);

const mockLandingPageRecord = {
    id: 123,
    name: "My Cool Landing Page",
    description: "Description text",
    template: 666,
    folder: {
        type: "folder",
        value: 123
    }
}


const LandingPageManager = mktoManager.assets.LandingPage
//LandingPageManager.on("find_request", config => console.log(config))

//  Get by ID
test("Get Landing Page by ID", async t => {
	nockScope
		.get("/rest/asset/v1/landingPage/123.json")
		.query(true)
		.reply(200, {
			success: true,
			result: [mockLandingPageRecord],
		});

	const findLandingPageResponse = await LandingPageManager.find({
		id: 123,
	});

	t.true(findLandingPageResponse.success);
	t.is(findLandingPageResponse.getFirst().id, 123);
});

//  Get by name
test("Get Landing Page by name", async t => {
	nockScope
		.get("/rest/asset/v1/landingPage/byName.json")
		.query({ name: "My Cool Landing Page"})
		.reply(200, {
			success: true,
			result: [mockLandingPageRecord],
		});

	const findLandingPageResponse = await LandingPageManager.find({
		name: "My Cool Landing Page",
	});

	t.true(findLandingPageResponse.success);
	t.is(findLandingPageResponse.getFirst().get("name"), "My Cool Landing Page");
});

//  Get all
test("Get Landing Pages with random max return", async t => {
    const randomMaxReturn = Math.floor(Math.random() * 180) + 1
	nockScope
		.get("/rest/asset/v1/landingPages.json")
		.query(requestParams => {
            return requestParams.maxReturn == parseInt(requestParams.maxReturn, 10) &&
                requestParams.offset == undefined
        })
		.reply(200, {
			success: true,
			result: Array(randomMaxReturn).fill(mockLandingPageRecord),
		});

	const findLandingPageResponse = await LandingPageManager.find({
		maxReturn: randomMaxReturn,
	});

	t.true(findLandingPageResponse.success);
	t.is(findLandingPageResponse.getAll().length, randomMaxReturn);
});

//  Stream large number of Landing Pages
test("Stream all Landing Pages", async t => {
    const maxOffset = 400
    const finalRequestMax = 125
	nockScope
		.get("/rest/asset/v1/landingPages.json")
        //.times(4)
		.query(requestParams => {
            return requestParams.maxReturn == 200 && requestParams.offset <= 400
        })
		.reply(200, {
			success: true,
			result: Array(200).fill(mockLandingPageRecord),
		})
        //  Final request
		.get("/rest/asset/v1/landingPages.json")
		.query(requestParams => {
            return !!requestParams.maxReturn && requestParams.offset >= 0
        })
		.reply(200, {
			success: true,
			result: Array(finalRequestMax).fill(mockLandingPageRecord),
		});

	const streamHandler = LandingPageManager.stream({
		maxReturn: 200,
	});

    let streamResultsCapture = []
    let eventCaptureFlag = false
    streamHandler.on("success", mktoResponse => {
        eventCaptureFlag = true
        streamResultsCapture.push(...mktoResponse.getAll())
    })
    const streamResults = await streamHandler.run()

	t.is(streamResults.length, (200*((maxOffset/200)+1)) + finalRequestMax)
	t.is(streamResultsCapture.length, (200*((maxOffset/200)+1)) + finalRequestMax)
    t.true(eventCaptureFlag)
});


//  Create new Landing Page
test("Create new Landing Page", async t => {
    const randomNewRecordId = Math.floor(Math.random() * 180) + 1
    
	nockScope
		.post("/rest/asset/v1/landingPages.json", payload => {
            return payload.name && 
                payload.folder && 
                payload.template
        })
		.query(true)
		.reply(200, {
			success: true,
			result: [{
                ...mockLandingPageRecord,
                id: randomNewRecordId,
                status: "draft",
            }],
		});

	const newLp = new LandingPageManager(mockLandingPageRecord);
    const createLpResponse = await newLp.create()

	t.true(createLpResponse.success);
	t.is(createLpResponse.getFirst().id, randomNewRecordId);
	t.is(createLpResponse.getFirst().get("status"), "draft");
});


//  Update Landing Page
test("Update Landing Page", async t => {
    const newDescText = "I am an updated description!"

    const newLp = new LandingPageManager(mockLandingPageRecord);
    newLp.set("description", newDescText)
    t.true(newLp.isChanged);

	nockScope
		.post(`/rest/asset/v1/landingPage/${newLp.id}.json`, payload => {
            return payload != undefined
        })
		.query(true)
		.reply(200, {
			success: true,
			result: [{
                id: newLp.id
            }],
		});

    const updateLpResponse = await newLp.update()

	t.true(updateLpResponse.success);
	t.is(updateLpResponse.getFirst().id, newLp.id);
	t.is(newLp.get("description"), newDescText);
});



//  Verify addLog helper adds to the description property after successful update call
test("Test API Log System", async t => {
    const apiLogMessage = (new Date).toISOString() + " auto updated asset sources"

    const newLp = new LandingPageManager(mockLandingPageRecord);
    newLp.addLog(apiLogMessage)
    t.true(newLp.isChanged);

	nockScope
		.post(`/rest/asset/v1/landingPage/${newLp.id}.json`, payload => {
            return payload != undefined
        })
		.query(true)
		.reply(200, {
			success: true,
			result: [{
                id: newLp.id
            }],
		});

    const updateLpResponse = await newLp.update()

	t.true(updateLpResponse.success);
	t.true(newLp.get("description").indexOf(apiLogMessage) > -1);
});

//  Verify approveDraft call
test("Approve LP Draft", async t => {
    const newLp = new LandingPageManager({
        ...mockLandingPageRecord,
        status: "draft"
    });

	nockScope
		.post(`/rest/asset/v1/landingPage/${newLp.id}/approveDraft.json`, payload => {
            return true
        })
		.query(true)
		.reply(200, {
			success: true,
			result: [{
                id: newLp.id
            }],
		});

    const updateLpResponse = await newLp.approveDraft()

	t.true(updateLpResponse.success);
	t.is(newLp._data.status, "approved");
});


//  Verify unapprove call
test("Unapprove LP", async t => {
    const newLp = new LandingPageManager({
        ...mockLandingPageRecord,
        status: "approved"
    });

	nockScope
		.post(`/rest/asset/v1/landingPage/${newLp.id}/unapprove.json`, payload => {
            return true
        })
		.query(true)
		.reply(200, {
			success: true,
			result: [{
                id: newLp.id
            }],
		});

    const updateLpResponse = await newLp.unapprove()

	t.true(updateLpResponse.success);
	t.is(newLp._data.status, "draft");
});


//  Verify unapprove call
test("Discard LP Draft", async t => {
    const newLp = new LandingPageManager({
        ...mockLandingPageRecord,
        status: "draft"
    });

	nockScope
		.post(`/rest/asset/v1/landingPage/${newLp.id}/discardDraft.json`, payload => {
            return true
        })
		.query(true)
		.reply(200, {
			success: true,
			result: [{
                id: newLp.id
            }],
		});

    const updateLpResponse = await newLp.discardDraft()

	t.true(updateLpResponse.success);
	t.is(newLp._data.status, "approved");
});



//  Verify Delete call
test("Delete LP", async t => {
    const newLp = new LandingPageManager({
        ...mockLandingPageRecord,
        status: "draft"
    });

	nockScope
		.post(`/rest/asset/v1/landingPage/${newLp.id}/delete.json`, payload => {
            return true
        })
		.query(true)
		.reply(200, {
			success: true,
			result: [{
                id: newLp.id
            }],
		});

    const updateLpResponse = await newLp.delete()

	t.true(updateLpResponse.success);
});


//  Verify Clone
test("Clone LP", async t => {
    const newLp = new LandingPageManager({
        ...mockLandingPageRecord,
        status: "approved"
    });

    const nextLpId = 1440
    const newFolder = {
        type: "folder",
        value: 3535
    }

	nockScope
		.post(`/rest/asset/v1/landingPage/${newLp.id}/clone.json`, payload => {
            return payload.name && payload.folder
        })
		.query(true)
		.reply(200, {
			success: true,
			result: [{
                ...newLp.data,
                folder: newFolder,
                name: newLp.get("name") + " 2",
                id: nextLpId
            }],
		});

    const cloneLpResponse = await newLp.clone({
        name: newLp.get("name") + " 2",
        folder: newFolder
    })

	t.true(cloneLpResponse.success);
	t.is(cloneLpResponse.getFirst().id, nextLpId);
	t.not(cloneLpResponse.getFirst().id, newLp.id);
	t.deepEqual(cloneLpResponse.getFirst().get("folder"), newFolder);
});
