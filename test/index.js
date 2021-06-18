const nockScope = require("./nock");
const testCredentials = require("../config.test");
const mktoManager = require("../lib")(testCredentials);

const init = async () => {
	// Set up the mock request.
	nockScope.get("/rest/asset/v1/landingPage/123.json")
        .matchHeader('Authorization', `Bearer ${nockScope._accessToken}`)
        .query({
            id: 123
        })
        .reply(200, {
            success: true,
		    result: [{ 
                id: 123,
                name: "My Cool LP",
                template: 666,
                customHeadHTML: "",
                facebookOgTags: "",
                robots: "noindex, nofollow",
                title: "My Cool Page",
                URL: "",
                computedUrl: "",
                status: "approved",
                updatedAt: "",
                createdAt: "",
                folder: {
                    type: "Folder",
                    value: 456
                }
            }],
	    });

	//  Find a LandingPage by ID
	mktoManager.assets.LandingPage.on("find_request", data => {
		console.log("request data", data);
	});
	const getLpResponse = await mktoManager.assets.LandingPage.find({
		id: 123,
	});

	console.log("getLpResponse", getLpResponse.summary);
	console.log("getLpResponse", getLpResponse.data);

	// Assert that the expected request was made.
	//nockScope.done();

	return;
};
init();
