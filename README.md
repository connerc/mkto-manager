# MktoManager

Dedicated Node logic for scripting automated changes and reports for Marketo instances.

## Library
All Marketo API logic is contained within `lib/`. The Root will also contain interfaces for using the API Instances via CLI, Node Apps, etc.

`lib/index.js` will read the `lib/assets/` directory and load all Asset Handlers into the module export. This include `BaseAsset`, which all other Asset Handlers are based on.


#### BaseAsset
BaseAsset creates a starting point for all Asset "Models", including instantiating our _shared_ instance of `MktoRequest`. API Credentials are passed to the exported function. Each Asset Handler Instance shares this MktoRequest instance for API communication (GETs and POSTs).

Static methods for searching for Assets are offered to streamline asset retrieval.

#### Mixins
To standardize and consolidate logic, shared functionality (props and methods) are written in Mixin objects and assigned to Class definitions where required.


#### MktoRequest
The `MktoRequest` class is a Marketo specific Axios/RateLimit/ApiConsumer wrapper that instantiates our Axios HTTP instance with necessary details to communicate with our Marketo API. `MktoRequest` accepts the necessary API credentials as parameters, and returns an object with initial methods.


#### MktoResponse
`MktoResponse` wraps API responses in an interactive Collection-type object. `MktoResponse` validates API responses and offers result-array getter methods that return instances of each Asset's corresponding Handler.

### BulkProcess
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
- [ ] Implement Lead classes
- [ ] Implement User Management classes
- [ ] Improve `BaseAsset` validation with Joi
- [ ] Improve `MktoResponse` validation with Joi
- [ ] Implement Event Emitter on MktoRequest (for database hooks)
- [ ] Implement Event Emitter on BulkProcess