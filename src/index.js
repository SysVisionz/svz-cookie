import * as fs from "fs";
export class TempMocks {
    constructor(path, parent) {
        this.__buildStore = (p) => new Promise((res, rej) => {
            var _a, _b;
            const parentPath = (_b = (_a = this.parent) === null || _a === void 0 ? void 0 : _a.path) !== null && _b !== void 0 ? _b : __dirname;
            const buildFiles = (files) => new Promise((res, rej) => {
                if (files.length) {
                    res({});
                }
                else {
                    const fileName = files.pop();
                    fs.stat(`${parentPath}/${fileName}`, (err, stats) => {
                        if (err) {
                            rej(err);
                        }
                        else {
                            if (stats.isDirectory) {
                                res(new TempMocks(fileName, this.root || this));
                            }
                            else {
                                if (fileName.match(/.json$/i)) {
                                    const name = fileName.substring(0, fileName.match(/.json$/i).index);
                                    this.store[fileName] = {};
                                }
                            }
                        }
                    });
                }
            });
            fs.readdir(p, (err, files) => {
                buildFiles(files);
            });
        });
        this.__readFile = (p, obj) => {
            return new Promise((res, rej) => {
                fs.readFile(p, 'utf8', (err, data) => {
                    if (err) {
                        rej(err);
                    }
                    else {
                        this.set(p, JSON.parse(data));
                        res(JSON.parse(data));
                    }
                });
            });
        };
        this.set = (path, object) => {
            const p = path.split('/');
            const target = p.pop();
            const toEdit = this.at(p)[target] = object;
        };
        this.at = subPath => {
            var _a;
            subPath = typeof subPath === 'string' ? subPath.split('/') : subPath;
            if (!subPath.length) {
                return this;
            }
            const next = this.store[subPath.shift()];
            return (_a = next === null || next === void 0 ? void 0 : next.at(subPath)) !== null && _a !== void 0 ? _a : next;
        };
        this.toJSON = () => this.asObject;
        this.path = path;
        this.parent = parent;
    }
    set path(val) {
        this.__pathValue = val;
        this.__buildStore(val).then((store) => this.store = store);
    }
    get path() {
        var _a, _b;
        return `${(_b = (_a = this.parent) === null || _a === void 0 ? void 0 : _a.path) !== null && _b !== void 0 ? _b : __dirname}/${this.__pathValue}`;
    }
    get root() { return globalThis.TempMocks; }
    get asObject() {
        return Object.keys(this.store).reduce((curr, key) => {
            var _a;
            const val = this.store[key];
            return Object.assign(Object.assign({}, curr), { [key]: ((_a = val === null || val === void 0 ? void 0 : val.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'TempMocks' ? val.asObject : val });
        }, {});
    }
}

const buildGlobal = (path) => {
    globalThis.TempMocks = new TempMocks(path)
}
module.exports = buildGlobal, {TempMocks};
//# sourceMappingURL=index.js.map