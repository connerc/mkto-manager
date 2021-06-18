const nock = require("nock");
const targetDomain = "http://localhost:8081";
const mktoAccessToken = "mkto-test-access-token"

const scope = nock(targetDomain)
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
		expires_in: (3599 * 1000),
		token_type: "bearer",
	});

scope._targetDomain = targetDomain;
scope._accessToken = mktoAccessToken;

module.exports = scope;
