const makeUsage = function ({ mktoRequest }) {
    class Usage {
        static async get(endpoint) {
            return await mktoRequest.request({
                method: "get",
                url: `/rest/${mktoRequest._apiVersion}/stats/${endpoint}`,
            });
        }

        static async getUsage() {
            return await Usage.get("usage.json");
        }

        static async getUsageLast7() {
            return await Usage.get("usage/last7days.json");
        }

        static async getErrors() {
            return await Usage.get("errors.json");
        }

        static async getErrorsLast7() {
            return await Usage.get("errors/last7days.json");
        }
    }

    return Usage;
};

module.exports = makeUsage;
