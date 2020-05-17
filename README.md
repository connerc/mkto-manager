# MktoManager

Dedicated Node logic for scripting automated changes and reports for Marketo instances. Emphasis on Asset (Email, Landing Page, Form, File, Folder) interactions, as well as Lead record and User record management. Written using ES6 Class definitions.

#### Read more on Marketo REST API Here:

[Marketo REST Api Docs](https://developers.marketo.com/rest-api/assets/)

## Usage

### Installation

```
npm i --save mkto-manager
```

### Create your Manager Object

```js
//  Retrieve the mkto-manager factory
const MktoInit = require("mkto-manager")

//  Define your REST API Credentials
const marketoRestCredentails = {
    mktoBaseUrl: "https://<Marketo Instance ID>.mktorest.com",
    mktoClientId: "marketo-client-id-guid-here",
    mktoClientSecret: "marketoClientSecretHashHere",
}

//  Mkto Config
const { mktoManager } = new MktoInit(marketoRestCredentails)
```

#### Static methods are offered for querying the API for an Asset type

```js
//  Find Landing Page by ID
mktoManager.assets.LandingPage.find({ id: 1234 })

//  Find Landing Page by Parent Folder
mktoManager.assets.LandingPage.find({
    folder: {
        id: 123, //  Folder ID
        type: "Folder", //  ["Program", "Folder"]
    },
})

//  Get multiple Programs
mktoManager.assets.Program.find({
    offset: 0,          //  Offset value, like a paging token (sort of)
    maxReturn: 200,     //  Defaults to 20 per the API Docs
})
```


## Library

All Marketo API logic is contained within `lib/`. ~~The root will also contain interfaces for using the API Instances via CLI, Node Apps, etc.~~

`lib/index.js` will read the `lib/assets/` directory and load all Asset Handlers into the module export. This include `BaseAsset`, which all other Asset Handlers are based on. Usage, User, and Lead Handler library information is also consumed here.

**All HTTP request methods are asynchronous and return Promises using Async/Await.**

#### BaseAsset

BaseAsset is a factory function that creates a starting point for all Asset API "Handlers", including instantiating our _shared_ instance of `MktoRequest`. API Credentials are passed to the exported factory function. Each Asset Handler Instance shares this MktoRequest instance for REST API communication.

**Each extended Class defines an Active Record type approach to API record management.**

A retrieved Landing Page record will store it's record data (only metadata per the API) in the `data` property. Record properties are retrieved and set via the corresponding methods:

```js
//  Find Landing Page by ID
const mySpecialLandingPage = await mktoManager.assets.LandingPage.find({ id: 1234 })

//  Check the Landing Page Name
if(mySpecialLandingPage.get("name") === "My Special LandingPage") {
    //  Update the Landing Page Name
    mySpecialLandingPage.set("name", "My Special Updated Landing Page")
}

```

At this point, the instance of `mySpecialLandingPage` has some of it's properties changed, but the Update call has not been made to the API. 

You can check if a record instance has pending updated property data with the getter properties:
```js
//  Check if the record has pending changes (Not submitted to the API)
if(mySpecialLandingPage.isChanged) {
    //  Is true because we changed the `name` property

    //  Get the properties that have been changed
    console.log( mySpecialLandingPage.changedData )
    /*
    Prints: {
        name: "My Special Updated Landing Page"
    }
    */
}
```


Static methods for searching for Assets are offered to streamline asset retrieval.

```js

```

#### Mixins

To standardize and consolidate certain record type logic, shared functionality (props and methods) are written in Mixin objects and assigned to Class definitions where required.

#### MktoRequest

The `MktoRequest` class is a Marketo specific Axios/RateLimit/ApiConsumer wrapper that instantiates our Axios HTTP instance with necessary details to communicate with our Marketo API. `MktoRequest` accepts the necessary API credentials as parameters, and returns an object with initial methods.

#### MktoResponse

`MktoResponse` wraps API responses in an interactive Collection-type object. `MktoResponse` validates HTTP and API responses and offers result-array getter methods that return instantiated instances of each Asset's corresponding Handler.

```js
//  Get all Landing Page's in a specific Folder
mktoManager.assets.LandingPage.find({
    folder: {
        id: 123, //  Folder ID
        type: "Folder", //  ["Program", "Folder"]
    },
}).then(function (mktoResponse) {
    //  Check if the API Response was successful
    if (mktoResponse.success === true) {
        //  Get the first result - still needed if you only expect 1 result
        const firstLandingPageResult = mktoResponse.getFirst()
        //  firstLandingPageResult is an instantiated isntance of the LandingPage Handler

        //  Get all results as an array of instantaited instances of the Handler
        const allLandingPageResults = mktoResponse.getAll()
    }

    /*
    mktoResponse = {
        success: true,  //  API Response Success
        status: 200,    //  HTTP Status Code

        //  Array of Instantiated Handler instance results
        result: [
            { id: 1, name: 'Toaster' ....} <Instantiated Asset Results>
            .... 
        ],

        
        //  Original Marketo Response Data
        _data: {
            success: true,
            requestId: '#asdasdasd',
            result: [
                { id: 1, name: 'Toaster' ....} <Instantiated Asset Results>
                ....
            ],
        }

        //  Reference to the Handler Instance
        _asset: <Asset Class>,

        //  Raw Axios Response
        _res: <Raw Axios Response>
    }
    */
})
```

### BulkProcess

:warning: `Work in progress`

Due to Marketo's API return limit of 200, `BulkProcess` acts as a auto-paging processor for large scale content reviews/updates.

Pass `BulkProcess` a config param detailing the Asset Handler, search criteria, and asynchronous success & error callbacks to handle large scale reviews/updates.

Example BulkProcess Config

```
{
    handler: null, //  <BaseAsset> Asset Specific instance

    searchParams: {}, //  getAsset Search Params

    //  Depicts if we should wait for the successCallback to finish before continuning to next iteration
    awaitSuccess: false,
    awaitError: false,

    successCallback: async function ( /*MktoResponse*/ response) {
        //  Accepts the getAsset method response MktoResponse instance

        if (response.success) {

        }
    },
    errorCallback: async function ( /*MktoResponse*/ response) {
        //  Accepts the getAsset method response MktoResponse instance

        if (response.success) {

        }
    },
    exitCallback: async function ( /*MktoResponse*/ response) {
        //  Accepts the getAsset method response MktoResponse instance

        if (response.success) {

        }
    },
}
```

---

### TODOs

-   [ ] Implement Lead classes
-   [ ] Implement User Management classes
-   [ ] Improve `BaseAsset` validation with Joi
-   [ ] Improve `MktoResponse` validation with Joi
-   [ ] Implement Event Emitter on MktoRequest (for database hooks)
-   [ ] Implement Event Emitter on BulkProcess instead of synchronous callback system
