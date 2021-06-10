const sandboxCreds = require("../mkto-actions/app/mktoManager/config.sand");
// console.log("sandboxCreds", sandboxCreds);

const mktoManager = require("./lib")(sandboxCreds);

//mktoManager.Usage.getUsage().then(resp => console.log(resp.data.result))
//mktoManager.User.roles().then(resp => console.log(resp.data));

const EmailAsset = mktoManager.assets.Email;
//EmailAsset.find({ maxReturn: 200 }).then(resp => console.log("resp", resp.getFirst().data));

// const assets = mktoManager.assets;
console.log("mktoManager", mktoManager);
//*/
