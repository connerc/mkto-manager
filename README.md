# MktoManager

Dedicated Node logic for scripting automated changes and reports for Marketo instances. Emphasis on Asset (Email, Landing Page, Form, File, Folder) interactions, as well as Lead record and User record management. Written using ES6 Class definitions.

#### Read more on Marketo REST API Here: [Marketo REST Api Docs](https://developers.marketo.com/rest-api/assets/)

## Usage

### Installation

```
$ npm i --save mkto-manager
```

### Create your Manager Object

```js
//  Retrieve the mkto-manager factory
const MktoManagerInit = require("mkto-manager")

//  Define your REST API Credentials
const marketoRestCredentails = {
    mktoBaseUrl: "https://<Marketo Instance ID>.mktorest.com",
    mktoClientId: "marketo-client-id-guid-here",
    mktoClientSecret: "marketoClientSecretHashHere",
}

//  Mkto Config
const { mktoManager } = new MktoManagerInit(marketoRestCredentails)
```

## Assets

The primary focus of this library is for Asset management. _Some Asset handlers are still in progress._

-   `mktoManager.assets.Channel`
-   `mktoManager.assets.Email`
-   `mktoManager.assets.EmailTemplate`
-   `mktoManager.assets.File`
-   `mktoManager.assets.Folder`
-   `mktoManager.assets.Form`
-   `mktoManager.assets.LandingPage`
-   `mktoManager.assets.LandingPageRedirect`
-   `mktoManager.assets.LandingPageTemplate`
-   `mktoManager.assets.Program`
-   `mktoManager.assets.Segment`
-   `mktoManager.assets.SmartCampaign`
-   `mktoManager.assets.SmartList`

#### Static methods are offered for querying the API for an Asset record

```js
//  Find Landing Page by ID
mktoManager.assets.LandingPage.find({ id: 1234 })

//  Find Landing Page by Parent Folder
mktoManager.assets.LandingPage.find({
    folder: {
        id: 123,            //  Folder ID
        type: "Folder",     //  ["Program", "Folder"]
    },
})

//  Get multiple Programs
mktoManager.assets.Program.find({
    offset: 0,              //  Offset value, like a paging token (sort of)
    maxReturn: 200,         //  Defaults to 20 per the API Docs
})
```

## Library

All Marketo API logic is contained within `lib/`. ~~The root will also contain interfaces for using the API Instances via CLI, Node Apps, etc.~~

`lib/index.js` will read the `lib/assets/` directory and load all Asset Handlers into the module export. This include `BaseAsset`, which all other Asset Handlers are based on. Usage, User, and Lead Handler library information is also consumed here.

:warning: **All HTTP request methods are asynchronous and return Promises using Async/Await.**


### MktoRequest

The `MktoRequest` class is a Marketo specific Axios/RateLimit/ApiConsumer wrapper that instantiates our Axios HTTP instance with necessary details to communicate with our Marketo API. `MktoRequest` accepts the necessary API credentials as parameters, and returns an object with initial methods.

Uses [`axios-rate-limit`](https://github.com/aishek/axios-rate-limit) to set a default Rate Per Second to try and remain compliant with Marketo's **100 calls per 20 seconds** and **Maximum of 10 concurrent API calls**.

Default Rate Limit: `{maxRPS: 4}`.

**You will not need to use `MktoRequest` directly.**

### MktoResponse

`MktoResponse` wraps API responses in an interactive Collection-type object. `MktoResponse` validates HTTP and API responses and offers result-array getter methods that return instantiated instances of each Asset's corresponding Handler.

```js
//  Get all Landing Page's in a specific Folder
mktoManager.assets.LandingPage.find({
    folder: {
        id: 123, //  Folder or Program ID
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
    } else {
        //  Capture Mkto API Warnings or Errors
        const mktoWarnings = mktoResponse.warnings
        const mktoErrors = mktoResponse.errors
    }
})
```

A `summary` prop is also available that offers a quick summary of Axios Request and Response / Mkto API Response information - _great for quickly getting a summary of the response when developing._

```js
mktoResponse.summary = {
    //  Request
    header: this._res.request._header,
    requestURL: this._res.config.url,
    method: this._res.config.method,
    params: this._res.config.params,
    //  Response
    status: this._res.status,
    success: this.success,
    result: this.result,
    errors: this.errors,
    warnings: this.warnings,
}
```

**Full `mktoResponse` Example Print**

```js
/*
mktoResponse = {
    status: 200,    //  HTTP Status Code
    success: true,  //  API Response Success

    //  Array of raw JSON results
    result: [
        { id: 1, name: 'Toaster' ....}
        ....
    ],
    //  Array of Instantiated Handler instance results
    data: [
        <Instantiated Asset Result>
        ....
    ],

    //  Response Warnings and Errors
    warnings: [
        //  Array of Marketo Warnings, if they were sent
        //  Defaults to empty array
    ],
    errors: [
        //  Array of Marketo Errors, if they were sent
        //  Defaults to empty array
    ],

    summary: {
        //  Request
        header: this._res.request._header,
        requestURL: this._res.config.url,
        method: this._res.config.method,
        params: this._res.config.params,
        //  Response
        status: this._res.status,
        success: this.success,
        result: this.result,
        errors: this.errors,
        warnings: this.warnings,
    }


    //  Original Marketo Response Data
    _data: {
        success: true,
        requestId: '#asdasdasd',
        result: [
            { id: 1, name: 'Toaster' ....} <Raw Asset Results>
            ....
        ],
    }

    //  Reference to the Handler Instance
    _asset: <Asset Class reference>,

    //  Raw Axios Response
    _res: <Raw Axios Response>
}
*/
```


---



### BaseAsset

BaseAsset is a factory function that creates a starting point for all Asset API "Handlers", including instantiating our _shared_ instance of `MktoRequest`. API Credentials are passed to the exported factory function. Each Asset Handler Instance shares this MktoRequest instance for REST API communication.

**Each extended Class defines an Active Record type approach to API record management.**

A retrieved Landing Page record will store it's record data (only metadata per the API) in the `data` property. Record properties are retrieved and set via the corresponding methods:

```js
//  Find Landing Page by ID
const specialPageSearchResponse = await mktoManager.assets.LandingPage.find({
    id: 1234,
})

//  Local reference to our first (and only) Landing Page Result
const mySpecialLandingPage = specialPageSearchResponse.getFirst()

//  Check the Landing Page Name
if (mySpecialLandingPage.get("name") === "My Special LandingPage") {
    //  Update the Landing Page Name
    mySpecialLandingPage.set("name", "My Special Updated Landing Page")
}
```

At this point, the instance of `mySpecialLandingPage` has one of it's properties changed, but the Update call has not been made to the API.

You can check if a record instance has pending updated property data with the getter properties:

```js
//  Check if the record has pending changes (Not submitted to the API)
if (mySpecialLandingPage.isChanged) {
    //  Is true because we changed the `name` property

    //  Get the properties that have been changed
    console.log(mySpecialLandingPage.changedData)
    //  Prints: {
    //    name: "My Special Updated Landing Page"
    //  }
}
```

Now that we have updated the local instance of the API Record, we can make the update call to POST the updated data back to Marketo:

```js
const updateMktoResponse = await mySpecialLandingPage.update()
```

This returns a new instance of `MktoResponse` - you check for API success the same way.

```js
if (updateMktoResponse.success === true) {
    //  Successful update of the Landing Page name property!
    //  The record self updates, so it no longer is "changed"
    //  mySpecialLandingPage.isChanged === false
}
```

The original record self updates its property tracking to aknowledge the `update()` success, meaning `isChanged` will now be `false`.

#### Mixins

To standardize and consolidate certain record type logic, shared functionality (props and methods) are written in Mixin objects and assigned to Class definitions where required.

_Examples: Clone, Delete, Content, and Variables methods and property handlers._


---


## All Asset method instructions:
_Coming Soon_


---


## Marketo REST API Inconsistencies
Likely due to the evolution of Marketo and its REST API over time, there are some serious inconsistencies with how the API responds, Asset to Asset.

I have tried to standardize the API interaction within this library as much as possible. However, some issues are unavoidable and should be taken into consideration.

I have documented these inconsistencies over at my personal blog: `Coming Soon`


---


## BulkProcess

:warning: `Work in progress`

Due to Marketo's API return limit of 200, `BulkProcess` acts as an auto-paging processor for large scale content reviews/updates.

Pass `BulkProcess` a config param detailing the Asset Handler, search criteria, and asynchronous success & error callbacks to handle large scale reviews/updates.

Example BulkProcess Config

```js
{
    handler: null, //  <BaseAsset> Asset Specific instance

    searchParams: {}, //  getAsset Search Params

    //  Depicts if we should wait for the successCallback to finish before continuing to next iteration
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
- [ ] Implement Lead classes
- [ ] Implement User Management classes
- [ ] Improve `BaseAsset` validation with Yup
- [ ] Improve `MktoResponse` validation with Yup
- [ ] Review `MktoRequest` retry method requirement
- [ ] Implement Event Emitter on `MktoRequest` (for database hooks)
- [ ] Implement Event Emitter on BulkProcess instead of synchronous callback system
- [ ] Develop tests and stubs for API