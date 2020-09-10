## BETA - Use at your own risk
I am still working out the final method corrections and improved error handling, I do not consider this ready for production use. **However, PRs are welcome if you would like to help develop this package or have opinions on how to improve the infrastructure.**

---

# MktoManager

Dedicated Node logic for scripting automated changes and reports for Marketo instances. Emphasis on Asset (Email, Landing Page, Form, File, Folder) interactions, as well as Lead record and User record management. Written using Async/Await Axios and ES6 Class definitions.

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
//  The `find` method will amend and change the Endpoint URI as needed depending on the search parameters you pass


//  Find Landing Pages by Parent Folder
mktoManager.assets.LandingPage.find({
    folder: {
        id: 123,            //  Folder ID
        type: "Folder",     //  ["Program", "Folder"]
    },
})


//  Get multiple Programs
mktoManager.assets.Program.find({
    offset: 0,              //  Offset value, like a paging token (sort of)
    maxReturn: 200,         //  Defaults to 20 per the API Docs, maximum 200
})
```

## Library

All Marketo API logic is contained within `lib/`.

`lib/index.js` will read the `lib/assets/` directory and load all Asset Handlers into the module export. This include `BaseAsset`, which all other Asset Handlers are based on. Usage, User, and ~Lead~ Handler library information is also consumed here.

:warning: **All HTTP request methods are asynchronous and return Promises.**


## Core Functions

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
        //  firstLandingPageResult is an instantiated instance of the LandingPage Handler

        //  Get all results as an array of instantiated instances of the Handler
        const allLandingPageResults = mktoResponse.getAll()
    } else {
        //  Capture Mkto API Warnings or Errors
        const mktoWarnings = mktoResponse.warnings
        const mktoErrors = mktoResponse.errors
    }
})
```

#### MktoResponse Properties
| Property | Description |
| --- | --- |
| `_res` | Full Axios Response Object - minus the Axios `data` property. |
| `_resultClass` | Stores the Handler instance if one was passed. |
| `_data` | Raw Axops `data` property. |
| --- | --- |
| `status` | HTTP Status Code as returned by Axios. |
| `success` | Handler specific logic for True/False success. Successful responses can still return Zero results. |
| `result` | Raw Marketo 'result' data, usually an array of records. |
| `warnings` | Array of Marketo Warnings - will return empty array if no warnings. |
| `errors` | Array of Marketo Errors - will return empty array if no errors. |
| `data` | Handler specific - either an Array of results Instantiated as Handler instances, or a single Instantiated Handler object. |



A `summary` prop is also available that offers a quick summary of Axios Request and Response / Mkto API Response information - _great for quickly visualizing a summary of the response when developing._

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

    //  Array of raw results
    result: [
        { id: 1, name: 'My Landing Page' ....}
        ....
    ],
    //  `result` Array as Instantiated Handler instances
    data: [
        <Instantiated Handler Result>,
        <Instantiated Handler Result>,
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
    _resultClass: <Asset Class reference>,

    //  Raw Axios Response
    _res: <Raw Axios Response>
}
*/
```

_NOTE: MktoResponse is extended for some of the "special" Marketo endpoints, like User Management. More details below in the User section._


---


### BaseAsset

BaseAsset is a factory function that creates a starting point for all Asset API "Handlers", including the instantiation of our _shared_ instance of `MktoRequest`. API Credentials are passed to the exported factory function. Each Asset Handler Instance shares this MktoRequest instance for REST API communication.

#### Create Asset
To create a net-new Asset, you can instantiate an instance of the Asset Handler, and then call the `create()` method.

```js
const myNewLandingPageData = {
    name: "My First Landing Page",  //  Page Name, required
    description: "",                //  Page Description, optional
    template: 9,                    //  Template ID, required
    folder: {                       //  Folder Object, required
        type: "Folder",
        id: 11
    }
}

const myNewLandingPage = new mktoManager.assets.LandingPage(myNewLandingPageData)

//  Send the Create request for our new Landing Page
const createMktoResponse = await myNewLandingPage.create();

if(createMktoResponse.success === true) {
	//  The Response Object should now contain a newly instantiated Landing Page with the data from the API, including the new ID
	//  Get the first (and only) result
	const myLandingPage = createMktoResponse.getFirst()
}
```

**You can now use this instantiated instance to set your Landing Page content!**


#### Update Asset
**Each extended Class defines an Active Record type approach to API record management.**

For example: A retrieved Landing Page record will store it's record data (only metadata per the API) in the `data` property. 
Record properties are retrieved and set via the corresponding methods:

| Method/Property | Description |
| --- | --- |
| `Asset.data` | Object with all Asset or User record data. |
| `Asset._data` | Object with all Asset or User record data - we store this object to compare changes to the `data` property. |
| `Asset.get(propertyName)` | Retrieves the given Property from the `Asset.data` object. |
| `Asset.set(propertyName, newValue)` | Sets the given Property in the `Asset.data` object to `newValue`. |
| `Asset.isChanged` | Computed boolean for depicting if any `data` property has been altered from it's original API data. |
| `Asset.changedData` | Computed object that will always list the `data` properties that have been altered from what was last retrieved from the API (the `_data` property). |

Here is an example of retrieving a record from the API, and updating one of it's properties:
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
    mySpecialLandingPage.set("name", "My Super Special Landing Page")
}
```

At this point, the instance of `mySpecialLandingPage` has one of it's properties changed, but the Update call has not been made to the API.

You can check if a record instance has pending updated property data with the computed properties:

```js
//  Check if the record has pending changes (Not submitted to the API)
if (mySpecialLandingPage.isChanged) {
    //  Is true because we changed the `name` property

    //  Get the properties that have been changed
    console.log(mySpecialLandingPage.changedData)
    //  Prints: 
    //  {
    //    name: "My Special Updated Landing Page"
    //  }
}
```

Now that we have updated the local instance of the API Record, we can make the update call to POST the updated data back to Marketo:

```js
const updateMktoResponse = await mySpecialLandingPage.update()

//  This returns a new instance of `MktoResponse` - you check for API success the same way.

if (updateMktoResponse.success === true) {
    //  Successful update of the Landing Page name property!
    //  If the `update()` response was successful, 
    //    the record self updates the `_data` property, 
    //    so it no longer is "changed"
    //  mySpecialLandingPage.isChanged === false
}
```
The original record self updates its property tracking to aknowledge the `update()` success, meaning `isChanged` will now be `false`.

### Mixins

To standardize and consolidate certain record type logic, shared functionality (props and methods) are written in Mixin objects and assigned to Class definitions where required.

_Examples: Clone, Delete, Content, and Variables methods and property handlers._

#### Variables
```js
Asset.getVariables({
    status: 'approved'  //  Optional, ['approved', 'draft']
})

Asset.updateVariables(variableId, newValue)
```

#### Content
```js
Asset.getContent({
    status: 'approved'  //  Optional, ['approved', 'draft']
})
//  Content Response structure is unique to each Asset. See Asset details below.

Asset.updateContent(contentId, newContent)
//  newContent is encoded as a Query String using the qs package.
```

#### Clone
```js
//  Traditionally, only a Folder target is needed for cloning an Asset
Asset.clone({
    folder: {
        type: "Folder",  //  ["Folder", "Program"]
        id: 0            //  Folder ID
    }
})
```

#### Delete
```js
//  Not all Assets can be deleted - some Assets must be "Unapproved" prior to deletion
Asset.delete()
//  Traditionally returns { id: <ID of deleted asset> }
```

#### Drafts
```js
//  Approve a Draft Node, if one exists
Asset.approveDraft()
//  Traditionally returns { id: <ID of deleted asset> }

//  Discard a Draft Node, if one exists
Asset.discardDraft()
//  Traditionally returns { id: <ID of deleted asset> }

//  Unapprove an Approved Node, if one exists
Asset.unapprove()
//  Traditionally returns { id: <ID of deleted asset> }
```

---


# All Asset method instructions:
All Assets extend BaseAsset, so the above mentions of `data` property management and `create()` and `update()` methods remains the same unless otherwise noted.

Additional Asset specific methods metnioned below.

## Channel
Marketo API does not allow for Channel Creation or Updating.

Methods `create()` and `update()` are voided. This is primarily offered for the static `find()` method.

## Email
### Update
Due to Marketo's interesting choice of splitting Email "Metadata" updates to two separate endpoints, 
this method will need to check changedData for certain props and fire TWO Post requests.

The first POST is for the Email Metadata:
+ 'name',
+ 'description',
+ 'operational',
+ 'published',
+ 'textOnly',
+ 'webView'

The second POST is for the Email "Content" - but not email body content.
+ 'fromEmail',
+ 'fromName',
+ 'replyEmail',
+ 'subject'

This returns a custom response object to compensate for sending to POST requests.
```js
//  ./lib/assets/Email.js - Line: 46
//  Return the boolean response of both
let returnData = {
    status: (metaDataResponse.status === 200 && contentResponse.status === 200) ? 200 : 666,
    success: (metaDataResponse.success && contentResponse.success) ? true : false,
    errors: [
        ...(metaDataResponse.errors ? metaDataResponse.errors : []), 
        ...(contentResponse.errors ? contentResponse.errors : []), 
    ],
    warnings: [
        ...(metaDataResponse.warnings ? metaDataResponse.warnings : []),
        ...(contentResponse.warnings ? contentResponse.warnings : []),
    ],

    metaDataResponse: metaDataResponse,
    contentResponse: contentResponse,
}
```

### Send Sample Email
Send a Sample Email by supplying a single Email Address, and optional LeadID for token/personalization processing.
```js
const sendEmailResponse = await myEmail.sendSample({
    emailAddress: 'text-inbox@example.com',  //  Required, will return false if not provided
    leadId: 1234,       //  Optional, allows you to sample email token/personalization processing by Lead Record
    textOnly: false,    //  Optional
})
```


### Get Variables
Returns Array of Variable Data such as Strings, Colors, Booleans, Numbers, Lists.
```js
const variablesEmailResponse = await myEmail.getVariables({
    status: 'approved' //  Optional, Status string, ['approved', 'draft']
})
//  Data will be an array of EmailVariableResponse objects
variablesEmailResponse.data = [
    //<EmailVariableResponse>,
    //<EmailVariableResponse>,
]
/*
EmailVariableResponse {
    "name": "twoArticlesSpacer6",   //  Treat this like the ID
    "value": "15",                  //  Value - String, 
    "moduleScope": false
}
*/
```

### Get Content
Returns Array of Content Sections such as Modules, Rich Text areas, Images, etc. Does not return Variables.
```js
const contentEmailResponse = await myEmail.getContent({
    status: 'approved' //  Optional, Status string, ['approved', 'draft']
})
//  Data will be an array of EmailContentResponse objects
contentEmailResponse.data = [
    //<EmailContentResponse>,
    //<EmailContentResponse>,
]
/*
EmailContentResponse {
    contentType (string): Type of content to set for the section. ,
    htmlId (string): HTML id of the content section ,
    index (integer, optional),
    isLocked (boolean, optional),
    parentHtmlId (string, optional),
    value (object): Contents of the section
}
*/
```

### Get Full Content
Returns the Full HTML Content of an Email Record for Version 2 Emails.
A shim is in place to return the JSON string content from `getContent()` method for Version 1 emails.

```js
const fullContentEmailResponse = await myEmail.getFullContent({
    status: 'approved', //  Optional, Status string, ['approved', 'draft']
    leadId: '',         //  Optional, process HTML by lead record
    type: 'HTML'        //  Optional, render as HTML or plain text
})
```

### Approve Draft
_See Drafts Mixin_

### Unapprove Email
_See Drafts Mixin_

### Discard Draft
_See Drafts Mixin_

### Delete Email
_See Delete Mixin_


## Landing Page

### Get Content
Returns Array of Content Sections such as Modules, Rich Text areas, Images, etc. Does not return Variables.
```js
const contentLandingPageResponse = await myLandingPage.getContent({
    status: 'approved' //  Optional, Status string, ['approved', 'draft']
})
//  Data will be an array of LandingPageContentResponse objects
contentLandingPageResponse.data = [
    //<LandingPageContentResponse>,
    //<LandingPageContentResponse>,
]
/*
LandingPageContentResponse {
    content (object, optional): Content of the section. Expected values vary based on type. Image: An image URL. RichText: HTML Content. HTML: HTML Content. Form: A form id. Rectangle: Empty. Snippet: A snippet id. ,
    type (string): Type of content section = ['Image', 'SocialButton', 'Form', 'DynamicContent', 'Rectangle', 'Snippet', 'RichText', 'HTML', 'Video', 'Poll', 'ReferralOffer', 'Sweepstakes']

    followupType (string, optional): Follow-up behavior of a form. Only available for form-type content sections. Defaults to form defined behavior. = ['url', 'lp', 'formDefined'],
    followupValue (string, optional): Where to follow-up on form submission. When followupType is lp, accepts the integer id of a landing page. For url, it accepts a url string. ,
    formattingOptions (JsonNode, optional),
    id (object): Id of the content section, may be a string or an int ,
    index (integer, optional): Index of the content section. Index orients the elements from lowest to highest ,
}
*/
```

### Get Full Content
Returns the Full HTML Content of an **Approved** Landing Page Record. This utilizes it's own Axios instance for a simple
HTTP Get request to the Page URL. Returns `false` if the Landing Page is not approved.

```js
const fullContentEmailResponse = await myLandingPage.getFullContent()
if(fullContentEmailResponse.success === true) {
    fullContentEmailResponse.data === '<doctype>...'
}
else {
    fullContentEmailResponse.data === {axiosError}
}
```

### Approve Draft
_See Drafts Mixin_

### Unapprove Email
_See Drafts Mixin_

### Discard Draft
_See Drafts Mixin_

### Delete Email
_See Delete Mixin_




---


## Marketo REST API Inconsistencies
Likely due to the evolution of Marketo and its REST API over time, there are some serious inconsistencies with how the API responds, Asset to Asset.

I have tried to standardize the API interaction within this library as much as possible. However, some issues are unavoidable and should be taken into consideration.

I have documented these inconsistencies over at my personal blog: `Coming Soon`


---


## BulkProcess

:warning: `Work in progress`

Due to Marketo's API return limit of 200, `BulkProcess` acts as an auto-paging processor for large scale content reviews/updates.

```js
const { bulkProcess } = new MktoManagerInit(marketoRestCredentails)
```

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