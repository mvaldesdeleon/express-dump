const pify = require('pify');
const mkdirp = require('mkdirp');
const { writeFile } = require('fs');
const { json } = require('body-parser');

const removeLast = fullPath => fullPath.split('/').slice(0, -1).join('/') || '/';

module.exports = function(options = {}) {
    const basePath = options.path ? `${__dirname}/${options.path}`: __dirname;
    const parser = json({
        limit: typeof options.limit === 'undefined' ? '10kb' : options.limit,
        type: () => true
    });
    const logs = {};

    const getFullPath = path => `${__dirname}${basePath}${path}`;
    const ensurePath = path => pify(mkdirp)(removeLast(getFullPath(path)));
    const writePathToFile = path => pify(writeFile)(`${getFullPath(path)}.json`, JSON.stringify(logs[path]));

    const log = (key, entry) => key in logs ? logs[key].push(entry) : logs[key] = [entry];
    const dumpPath = path => ensurePath(path).then(() => writePathToFile(path));

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
