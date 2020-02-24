
//  Server
const express = require('express')
const app = express()
const port = 8081

//  Helpers
const fs = require('fs-extra')
const path = require('path')
const generateGUUID = require(path.join(process.cwd(), './lib/helpers/generateGUUID'))

//  Handlers
const AllCollectors = {
    assets: fs.readdirSync(path.join(__dirname, '../lib/assets')),
    leads: fs.readdirSync(path.join(__dirname, '../lib/assets'))
}

const AssetHandlers = {}
AllCollectors.assets.forEach((assetName, index) => {
    if (assetName.includes('.js')) {
        let spawnReturn = require(path.join(`../lib/assets/${assetName}`))
        if (spawnReturn) {
            AssetHandlers[assetName] = spawnReturn()
        }
    }
})
console.log('AssetHandlers', AssetHandlers)


//  Endpoint DEFS
const authEndPoint = '/identity/oauth/token'
const URI = '/rest/asset/v1'


/**
 * Auth Token retrieve
 */
app.get(authEndPoint, (req, res) => {
    res.json({
        access_token: generateGUUID() + ':js',
        token_type: 'bearer',
        expires_in: 3330,
    })
})


/**
 * Asset API Endpoints
 */
for (let HandlerName in AssetHandlers) {
    if (AssetHandlers.hasOwnProperty(HandlerName)) {
        let thisHandler = AssetHandlers[HandlerName]

        let endpoint = URI + '/' + thisHandler.endpoint
        console.log(HandlerName + ': ' + endpoint)

        //  TODO: Create a Asset specific generator here - maybe update AssetHandlers to contain ALL props that can be used to generate random data?
        let response = {
            success: true,
            errors: [],
            //requestId: '7971#16f8258cfab',
            requestId: generateGUUID(),
            warnings: [],
            result: []
        }

        /**
         * GET Requests
         */
        //  Search
        app.get(endpoint + 's.json', (req, res) => {
            res.json(response)
        })
        //  byName
        app.get(endpoint + '/byName.json', (req, res) => {
            res.json(response)
        })
        app.get(endpoint + '/{id}.json', (req, res) => {
            res.json(response)
        })

        /**
         * POST Requests  -  TODO Extend this
         */
        app.post(endpoint + '/{id}.json', (req, res) => {
            res.json(response)
        })
    }
}
//*/


const swaggerData = fs.readFileSync(path.join(__dirname, './data/swagger-asset-576-NIT-050.json'), 'utf8')
//console.log('swaggerData', swaggerData)

let response = {
    success: true,
    errors: [],
    //requestId: '7971#16f8258cfab',
    requestId: generateGUUID(),
    warnings: [],
    result: []
}

for (let path in swaggerData.paths) {
    let pathData = swaggerData.paths[path]
    
    //  Update path data for variables

    if (pathData.get) {
        let getConsumes = pathData.get.consumes
        let getProduces = pathData.get.produces
        let getParams = pathData.get.parameters

        let getResponse = pathData.get.response[200].schema.$ref
        let getResult = getResponse.split()

        app.get(endpoint, (req, res) => {
            res.json({{
                ...response,
                result: getResult
            }})
        })
    }

    if (pathData.post) {
        let postConsumes = pathData.post.consumes
        let postProduces = pathData.post.produces
        let postParams = pathData.post.parameters
    }
}


app.listen(port, () => console.log(`Example app listening on port ${port}!`))