const pify = require('pify');
const mkdirp = require('mkdirp');
const { writeFile } = require('fs');
const { json } = require('body-parser');

module.exports = function(options = {}) {
    const basePath = options.path || '.';
    const parser = json({
        limit: typeof options.limit === 'undefined' ? '10kb' : options.limit,
        type: () => true
    });
    const logs = {};

    const pathToFile = path => path.replace(/\//g, '.');

    const log = (key, entry) => key in logs ? logs[key].push(entry) : logs[key] = [entry];
    const dumpPath = path => pify(writeFile)(`${basePath}/${pathToFile(path)}.json`, JSON.stringify(logs[path]));

    const middleware = (req, res) => {
        log(req.path.slice(1), req.body);
        res.sendStatus(200);
    };

    return {
        middleware: function(req, res, next) {
            if (req.body) middleware(req, res, next);
            else parser(req, res, () => middleware(req, res, next));
        },
        dump: function(path) {
            return pify(mkdirp)(basePath)
                .then(() => {
                    if (path) return dumpPath(path);
                    else return Promise.all(Object.keys(logs).map(dumpPath));
                });
        }
    };
};
