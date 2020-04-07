const tracer = require('tracer')
const Emitter = require('component-emitter');

/**
 * TODO: Transition this to utilize more event emissions instead of callbacks
 */
class BulkProcess {

    //  Making default config static so that nested objects can be retrieved and extended prior to instantiation
    static get _defaultConfig() {
        return {
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
    }

    constructor(config, LOGGER) {

        Emitter(this)

        if (LOGGER) {
            this.LOGGER = LOGGER
        }
        else {
            this.LOGGER = tracer.colorConsole({
                level: 'info',
                transport: [
                    // function (data) {
                    //     fs.appendFile(path.join(REPORT_STORAGE, 'tracer.log'), data.rawoutput + '\n', (err) => {
                    //         if (err) throw err;
                    //     });
                    // },
                    function (data) {
                        console.log(data.output);
                    }
                ]
            })
            this.LOGGER.debug('Default LOGGER Created')
        }

        //  Merge our default and passed config objects
        this.config = {
            ...BulkProcess._defaultConfig,
            ...config,
        }


        this.response = {
            result: []
        }

    }




    /**
     * Runs the BulkProcess Cycler with the constructor config
     * 
     * TODO: Create better loggers and a improved response object here that includes callback response Promises?
     */
    async run() {

        const counters = {
            total: 0,
            success: 0,
            error: 0,
            failures: 0,
        }

        //  Define our cycler maxReturn and overall maxIteration safety check integers here
        const cycleMaxReturn = (this.config.cycleMaxReturn ? this.config.cycleMaxReturn : 5) //  Max 200 - better success found with smaller increments
        const cycleMaxIteration = (this.config.cycleMaxIteration ? this.config.cycleMaxIteration : 200)

        const Handler = this.config.handler

        //  Starting values
        let cycleStart = true,
            cycleIndex = 0,
            cycleOffset = (this.config.searchParams.offset ? this.config.searchParams.offset : 0),  //  Allow the passed Search Param for starting offset
            resultCount = 0,
            safetyCheckBreaker = false

        /**
         * Define an obj for our large scale
         * 
         * Requests
         * Push all request response data into a single array, and use the data.requestId as the key
         *  {
                status: 200,
                statusText: 'OK',
                data: {
                    success: true,
                    errors: [],  //  If success === false
                    requestId: '10feb#16e26d4997c',
                }
            }
         * 
         * 
         * Results
         * We will push all results into the same array for easy mass iteration on the results
         * To tie our results back to their corresponding Request response data, we will add the requestId prop to the result item
         * 
         * 
         * Errors
         * We will push all Errors into the same array for easy mass iteration on the errors
         * To tie our errors back to their corresponding Request response data, we will add the requestId prop to the error item
         */
        var cycleResponse = {
            requests: {}, //  Request response data (success, status, statusText) keyed by `requestID`
            results: [], //  ALL Merged instantiated Asset Results, each containing it's `requestID`
            errors: [], //  All Merged Errors array, each containing  it's `requestID`
            'HTTP_ERROR': [], //  Special results for logging HTTP_ERRORS
        }

        /**
         * safetyCheckBreaker, easy way to quick kill the while loop from within a terminal cycle
         * 
         * (cycleIndex <= cycleMaxIteration) Setting a maximum iteration count as an additional safeguard
         * 
         * (resultCount === cycleMaxReturn || cycleStart) Verifying that the LAST cycle collected at least results.count equal to cycleMaxReturn
         * OR
         * We skip the result count check if it is our first cycle!
         */

        if (!safetyCheckBreaker) this.LOGGER.log('safetyCheckBreaker OK')

        if (cycleIndex <= cycleMaxIteration) this.LOGGER.log('cycleIndex <= cycleMaxIteration')

        if (resultCount === cycleMaxReturn || cycleStart) this.LOGGER.log('resultCount === cycleMaxReturn || cycleStart')

        /**
         * While Loop
         * safetyChecker is FALSE
         * cycleIndex is less that or equal to the cycleMaxIteration (for safety)
         * (
         *  previous resultCount is equal to the maximum amount we need to return (tells us there are _likely_ more results to retrieve)
         *  OR
         *  cycleStart is true, which means this is our first iteration and we should skip the resultCount === cycleMaxReturn check
         * )
         */
        //while (!safetyCheckBreaker && (cycleIndex <= cycleMaxIteration) && (resultCount === cycleMaxReturn || cycleStart)) {
        while (!safetyCheckBreaker && (cycleIndex <= cycleMaxIteration) && (resultCount != 0 || cycleStart)) {

            this.LOGGER.info('** Starting New Cycle', {
                //...this.config.searchParams,
                cycleIndex: cycleIndex,
                cycleOffset: cycleOffset,
                cycleStart: cycleStart
            })

            //  Update that we have "completed" our first cycle
            cycleStart = false

            //  Merge the passed searchParams Object with our iterating searchOffset Criteria for pagination
            let cycleSearchCriteria = {
                ...this.config.searchParams,
                //  Merge new Offset and MaxReturn Values
                offset: cycleOffset,
                maxReturn: cycleMaxReturn
            }

            /**
             * Retrieve the Response with given URI and search params
             */
            //console.log('cycleSearchCriteria', cycleSearchCriteria)
            let response = await Handler.find(cycleSearchCriteria)
            // console.log('response.success', response.success)
            // console.log('response.result', response.result)

            //  Check for HTTP Status Code
            if( response.status !== 200) {
                //  HTTP Request failed, log the request error
                //  Store the Request data by requestId
                if (cycleResponse.requests['HTTP_ERROR']) {
                    cycleResponse.requests['HTTP_ERROR'][cycleIndex] = response
                }
                //  Trip our cycle Breaker so we don't try again
                safetyCheckBreaker = true

                this.emit('request_http_error', response)
            }

            //  Check for Marketo Request Success
            if (response._data.requestId) {
                //  Store the Request Response data keyed by requestId
                cycleResponse.requests[response._data.requestId] = {
                    success: response.success,
                    status: response.status,
                    statusText: response._res.statusText,
                    data: {}
                }
            }


            if(!response.success) {
                this.emit('request_mkto_error', response)


                this.LOGGER.warn('!!!! Response unsuccessful!', response)
                //  Update this cycles Result Count
                //resultCount = response.data.results.length
                resultCount = 0 //  We have encountered and error, and must break the while cycler!
                safetyCheckBreaker = true

                if (!response._res.data) {
                    this.LOGGER.log('Missing Data 2', response)
                    //return
                }

                //  Store the Errors into our errors Array
                if (response.errors) {

                    this.LOGGER.error('  |  errors', response.errors)

                    /**
                     * If we have a error callback, call it here on this collection of results
                     */
                    if (this.config.errorCallback) {
                        //  Store the errorCallback value into our request tracking
                        cycleResponse.requests[response._data.requestId].errorResponse = this.config.errorCallback(response)
                    }

                    //  Merge our response errors into the cycleResponse bulk store
                    cycleResponse.errors = [
                        ...cycleResponse.errors,
                        ...response.errors.map((error) => {
                            error.requestId = response.requestId //  update the error to carry it's response `requestID`
                            return error
                        })
                    ]
                }
            }

            //  If the response has NO data, throw an error maybe? TODO
            if (!response._data) {
                this.LOGGER.warn('Missing Request Data', response)
                return false
            }

            //  Check for proper HTTP Request Response
            if (response.success) {

                this.emit('request_success', response)

                if (response._data) {
                    //  Store the Request Response data keyed by requestId
                    // cycleResponse.requests[response._data.requestId] = {
                    //     success: response.success,
                    //     status: response.status,
                    //     statusText: response._res.statusText,
                    //     data: {}
                    // }


                    if (!response.result || response.result.length === 0) {
                        //  Record that we have a successful response, but that NO data items were returned
                        this.LOGGER.log('')
                        this.LOGGER.warn('!!!! NO Result Data found!')
                        
                        if (response._data) {
                            if (response._data.errors.length > 0) {
                                this.LOGGER.error('  |  errors', response._data.errors)
                            }

                            if (response._data.warnings.length > 0) {
                                this.LOGGER.warn('  |  warnings', response._data.warnings)
                            }
                        }
                        //  Update this cycles Result Count to be Zero - this will stop the cycler
                        resultCount = 0
                    }


                    /**
                     * Successful new result capture
                     */
                    //  Verify we have instantiated results data
                    if (!!response.result) {
                        //  Update this cycles Result Count by length of results (data) array
                        resultCount = response.result.length
                        console.log('resultCount', resultCount)
                        console.log('')

                        //  Increment our counters
                        counters.total = counters.total + resultCount
                        //counters.success = counters.success + resultCount

                        //  Update the cycleOffset for the next cycle
                        cycleOffset = (cycleOffset + resultCount)


                        /**
                         * If we have a success callback, call it here on this collection of results
                         */
                        if (this.config.successCallback) {
                            if (this.config.awaitSuccess) {
                                //  Store the successCallback value into our request tracking
                                let successCallBackResponse = await this.config.successCallback(response, cycleOffset)
                                cycleResponse.requests[response._data.requestId].successResponse = successCallBackResponse

                                this.emit('success', response)

                                this.LOGGER.info(`successCallBackResponse index: ${cycleIndex}`, successCallBackResponse)
                            }
                            else {
                                //  Store the successCallback value into our request tracking
                                cycleResponse.requests[response._data.requestId].successResponse = this.config.successCallback(response, cycleOffset).then((resp) => {
                                    this.LOGGER.info(`successCallBackResponse index: ${cycleIndex}`, resp)
                                })
                            }
                        }


                        //  Store the results
                        cycleResponse.results = [
                            ...cycleResponse.results,
                            ...response.data
                        ]
                    }
                }
            }

            //  Increment our Cycle Index
            cycleIndex++;
            this.config.cycleIndex = cycleIndex
            this.config.cycleOffset = cycleOffset
            //this.LOGGER.log('')
        }

        //  TODO - whats the use case for the exitCallback here?
        //  If we successfully complete the while loop and we did NOT trip our Safety Breaker
        // if (!safetyCheckBreaker && _config.exitCallback) {
        //     cycleResponse = await _config.exitCallback(cycleResponse)
        // }

        this.LOGGER.info('Cycle Finished:', {
            safetyCheckBreaker: safetyCheckBreaker,
            resultCount: resultCount,
            cycleMaxReturn: cycleMaxReturn,
        })

        this.emit('finished', this)

        this.LOGGER.info('+++++++++++++++ counters:', counters.total)

        return true
    }
}

module.exports = BulkProcess