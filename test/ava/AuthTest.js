const test = require("ava");
const nockScope = require("../nock");

const testCredentials = require("../../config.test");
const mktoManager = require("../../lib")(testCredentials);


//  Test manually retrieving am auth token
test("Verify Auth Token and expiration", async t => {
	//  Identity mock endpoint already defined and persisted
    //  inside the local nock bootstrapper
    const globalMktoRequest = mktoManager.assets.LandingPage.prototype.mktoRequest
	const getAuthTokenResponse = await globalMktoRequest.getAuthToken()

	t.true(getAuthTokenResponse);
	t.true(globalMktoRequest.apiAuthToken._expire > (Date.now()));
});