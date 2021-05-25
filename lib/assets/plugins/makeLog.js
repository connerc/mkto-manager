//const regexSearch = /(?:---[\r\n]+)((.*)[\n\r])+(?:^---[\r\n]+)/mg
module.exports = function (AssetHandler, config = { targetProp: "description" }) {
    Object.defineProperty(AssetHandler, "_hasApiBlock", {
        get() {
            return this._apiLogBlock != null;
        },
    });

    Object.defineProperty(AssetHandler, "_apiLogProperty", {
        get() {
            return this.get(config.targetProp)
        },
        set(newVal) {
            console.log("\nnewVal\n", newVal)
            this.data[config.targetProp] = newVal
            return this.set(config.targetProp, newVal)
        }
    })

    Object.defineProperty(AssetHandler, "_apiLogBlock", {
        get() {
            //const regexSearch = /---[\s\S](.*?)---[\s\S]/gi;
            const regexSearch = /(?:---[\r\n])((.*[\n\r])*)/gm;

            //  Parse the current Asset's property (defaults to the description) for our API Log block
            const result = regexSearch.exec(this._apiLogProperty);

            return result;
        },
    });

    Object.defineProperty(AssetHandler, "apiLogs", {
        get() {
            //  Get the API Log Block parse
            const loggerParse = this._apiLogBlock;

            //  If we parsed the API Block, offer the parsed API logs back to the user
            if (loggerParse) {
                return loggerParse[1].split("\n").filter(logRow => logRow != '');
            }

            //  Otherwise return an empty array
            return [];
        },
    });

    AssetHandler.addLog = function (log) {
        if (this._hasApiBlock) {
            const currentLogs = this.apiLogs;
            //  Append the new log
            currentLogs.push(log);

            //  Rewrite the apiLogs block back into the AssetHandler property
            const loggerParse = this._apiLogBlock;

            //  Slice off the original API Log Block text 
            const trimmedPropertyText = this._apiLogProperty.slice(0, loggerParse.index)

            const newPropertyText = trimmedPropertyText + `
---
${currentLogs.join('\n')}
---`
            //  Set the Log Property as our newly minted text string
            this._apiLogProperty = newPropertyText
        }
        else {
            console.log("No existing API Log Block")
        }
    };
};
