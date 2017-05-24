const pify = require('pify');
const { writeFile } = require('fs');
const { json } = require('body-parser');

module.exports = function(options = {}) {
    const basePath = options.basePath || '';
    const parser = json({
        limit: typeof options.limit === 'undefined' ? '10kb' : options.limit,
        type: () => true
    });
    const logs = {};

    const log = (key, entry) => key in logs ? logs[key].push(entry) : logs[key] = [entry];
    const dumpPath = path => pify(writeFile)(`${__dirname}${basePath}${path}.json`, JSON.stringify(logs[path]));

    const middleware = (req, res) => {
        log(req.path, req.body);
        res.sendStatus(200);
    };

    return {
        middleware: function(req, res, next) {
            if (req.body) middleware(req, res, next);
            else parser(req, res, () => middleware(req, res, next));
        },
        dump: function(path) {
            if (path) return dumpPath(path);
            else return Promise.all(Object.keys(logs).map(dumpPath));
        }
    };
};
