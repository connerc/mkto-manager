const test = require("ava");
const nockScope = require("../nock");

const testCredentials = require("../../config.test");
const mktoManager = require("../../lib")(testCredentials);

//  Test manually retrieving am auth token
test("Retrieve User by ID", async t => {
	const userid = "jamie@houselannister.com";

	nockScope
		.get(`/userservice/management/v1/users/${userid}/user.json`)
		.query(true)
		.reply(200, {
			success: true,
			result: {
				userid: "jamie@houselannister.com",
				firstName: "Jamie",
				lastName: "Lannister",
				emailAddress: "jamie@lannister.com",
				optedIn: false,
				failedLogins: 0,
				failedDeviceCode: 0,
				isLocked: false,
				lockedReason: null,
				id: 0,
				apiOnly: false,
				userRoleWorkspaces: [
					{
						accessRoleId: 1,
						accessRoleName: "Admin",
						workspaceId: 0,
						workspaceName: "AllZones",
					},
					{
						accessRoleId: 2,
						accessRoleName: "Standard User",
						workspaceId: 1008,
						workspaceName: "World",
					},
				],
				expiresAt: "2020-12-31T08:00:00.000t+0000",
				lastLoginAt: "2020-02-05T01:02:23.000t+0000",
			},
		});

	const getUserResponse = await mktoManager.User.find({ id: userid });
	t.true(getUserResponse.success);

	const myUser = getUserResponse.getFirst();
	t.is(myUser.get("firstName"), "Jamie");
});
