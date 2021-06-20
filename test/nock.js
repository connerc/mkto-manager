const nock = require("nock");
const targetDomain = "http://localhost:8081";
const mktoAccessToken = "mkto-test-access-token";

const testSuite = {
	_targetDomain: targetDomain,
	_accessToken: mktoAccessToken,
	authScope: nock(targetDomain)
		.defaultReplyHeaders({
			"X-Powered-By": "Nock",
			"Content-Type": "application/json",
		})
		//  Identity Auth Token
		.persist()
		.get("/identity/oauth/token")
		.query({
			grant_type: "client_credentials",
			client_id: "GUID-GOES-HERE-FOR-THE-CLIENT-ID",
			client_secret: "iamaverylengthyandrandomsecretcreatedbymarketo",
		})
		.reply(200, {
			access_token: mktoAccessToken,
			scope: "string",
			expires_in: 3599 * 1000,
			token_type: "bearer",
		}),
	requestScope: nock(targetDomain, {
		reqheaders: {
			authorization: `Bearer ${mktoAccessToken}`,
		},
	}),
};
//  Subsequent request with malformed Auth Token
//  TODO: Can we define a "catch-all" nock request where the Auth token is incorrect?

module.exports = testSuite;
