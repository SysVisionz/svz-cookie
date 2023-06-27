module.exports = class SuperCookie {
    constructor(name, parameters = {}) {
        this.toJSON = () => {
            return this.value;
        };
        this.name = name;
        this.pVals = parameters;
    }
    valueOf() {
        return this.value;
    }
    get value() {
        return SuperCookie.get(this.name, true);
    }
    get path() {
        return this.parameters.path;
    }
    get domain() {
        return this.parameters.domain;
    }
    get expires() {
        return this.parameters.expires;
    }
    get secure() {
        return this.parameters.secure;
    }
    get maxAge() {
        return this.parameters.maxAge;
    }
    get sameSite() {
        return this.parameters.sameSite;
    }
    get httpOnly() {
        return this.parameters.httpOnly;
    }
    get parameters() {
        return this.pVals;
    }
    set value(value) {
        SuperCookie.set(this.name, value, this.parameters);
    }
    set expires(value) {
        this.parameters.expires = value;
        ;
        SuperCookie.set(this.name, this.value, this.parameters);
    }
    set path(value) {
        this.parameters.path = value;
        SuperCookie.set(this.name, this.value, this.parameters);
    }
    set domain(value) {
        this.parameters.domain = value;
        SuperCookie.set(this.name, this.value, this.parameters);
    }
    set maxAge(value) {
        this.parameters.maxAge = value;
        SuperCookie.set(this.name, this.value, this.parameters);
    }
    set parameters(parameters) {
        if (parameters.maxAge) {
            parameters.maxAge;
        }
        this.pVals = parameters;
        SuperCookie.set(this.name, this.value, this.parameters);
    }
    set sameSite(value) {
        this.pVals.sameSite = value;
        SuperCookie.set(this.name, this.value, this.parameters);
    }
    set prefix(value) {
        this.pVals.prefix = value;
        SuperCookie.set(this.name, this.value, this.parameters);
    }
    delete() {
        SuperCookie.delete(this.name, this.path);
    }
    static set(name, value, parameters) {
        if (name) {
            const typeObject = (value, topLevel) => {
                if (value === undefined) {
                    return 'undefined:undefined';
                }
                if (value === null) {
                    return 'null:null';
                }
                switch (value.constructor.name) {
                    case 'Date':
                        return `${value.constructor.name}:${value.toJSON()}`;
                    case 'Symbol':
                        return `${value.constructor.name}:${value.toString().substring(7, value.toString().length - 1)}`;
                    case 'Boolean':
                    case 'BigInt':
                        return `${value.constructor.name}:${value}`;
                    default:
                        return typeof value === 'object'
                            ? topLevel ? `${value.constructor.name}:${JSON.stringify(typeObject(value))}` :
                                value instanceof Array
                                    ? value.map((v) => typeObject(v))
                                    : Object.entries(value).reduce((value, entry) => (Object.assign(Object.assign({}, value), { [entry[0]]: typeObject(entry[1]) })), {})
                            : value;
                }
            };
            value = typeObject(value, true);
            let cookieString = name + '=' + encodeURIComponent(value) + ';';
            if (parameters) {
                for (const i in parameters) {
                    if (parameters[i]) {
                        switch (i) {
                            case 'expires':
                                const date = typeof (parameters === null || parameters === void 0 ? void 0 : parameters.expires) === 'object' ? parameters === null || parameters === void 0 ? void 0 : parameters.expires : new Date(parameters === null || parameters === void 0 ? void 0 : parameters.expires);
                                cookieString += ' expires=' + date.toUTCString() + ';';
                                break;
                            case 'path':
                                cookieString += 'path=' + (parameters === null || parameters === void 0 ? void 0 : parameters.path) + ';';
                                break;
                            case 'secure':
                                cookieString += (parameters === null || parameters === void 0 ? void 0 : parameters[i]) ? ' secure;' : "";
                                break;
                            case 'sameSite':
                                cookieString += ' samesite=' + (parameters === null || parameters === void 0 ? void 0 : parameters.sameSite) + ';';
                                break;
                            case 'maxAge':
                                cookieString += ' max-age=' + (parameters === null || parameters === void 0 ? void 0 : parameters.maxAge) + ';';
                                break;
                            case 'domain':
                                cookieString += ' domain=' + (parameters === null || parameters === void 0 ? void 0 : parameters.domain) + ';';
                                break;
                            case 'httpOnly':
                                cookieString += (parameters === null || parameters === void 0 ? void 0 : parameters[i]) ? ' HttpOnly;' : '';
                                break;
                            case 'prefix':
                                cookieString = `${(parameters === null || parameters === void 0 ? void 0 : parameters[i]) === 'host'
                                    ? '__Host-'
                                    : (parameters === null || parameters === void 0 ? void 0 : parameters[i]) === 'secure' ? '__Secure-' : ''}${cookieString}`;
                        }
                    }
                }
            }
            document.cookie = cookieString;
        }
        else {
            throw 'TypeError: Requires (name, value, [parameters]) arguments';
        }
    }
    static get(name, asPlainObject) {
        return this.getFull(asPlainObject)[name];
    }
    static getFull(asPlainObject) {
        return document.cookie.split(';').reduce((cookie, val) => {
            let [key, valueOf] = val.split('=');
            key = key.trim();
            if (!asPlainObject) {
                const params = {};
                if (key.match(/$__Host-/)) {
                    key = key.substring(7);
                    params.prefix = "host";
                }
                if (key.match(/$__Secure-/)) {
                    key = key.substring(9);
                    params.prefix = 'secure';
                }
                return Object.assign(Object.assign({}, cookie), { [key]: new SuperCookie(key, params) });
            }
            val = decodeURIComponent(valueOf);
            const untype = (value) => {
                if (value instanceof Array) {
                    return value.map(value => untype(value));
                }
                if (value instanceof Object) {
                    return Object.entries(value).reduce((val, entry) => (Object.assign(Object.assign({}, val), { [entry[0]]: untype(entry[1]) })), {});
                }
                if (typeof value === 'number' || (Number(value) == value && String(Number(value)) === value)) {
                    return Number(value);
                }
                if (typeof value === 'string' && !value.includes(":")) {
                    return value;
                }
                if (typeof value === 'string' && value === 'null:null') {
                    return null;
                }
                if (typeof value === 'string' && value === 'undefined:undefined') {
                    return undefined;
                }
                const [identifier, ...decodedVal] = value.split(':');
                value = decodedVal.join(':');
                switch (identifier) {
                    case 'Array':
                    case 'Object':
                        return untype(JSON.parse(value));
                    case 'Date':
                        return new Date(value);
                    case 'Boolean':
                        return value === 'true';
                    case 'BigInt':
                        return BigInt(value);
                    case 'Symbol':
                        return Symbol(value);
                    default:
                        return value;
                }
            };
            return Object.assign(Object.assign({}, cookie), { [key]: untype(val) });
        }, {});
    }
    static delete(name, path) {
        document.cookie = `${name}=null; max-age=0; ${path ? `path=${path};` : ''}${domain ? ` domain=${domain}` : ''}`;
    }
}
//# sourceMappingURL=index.js.map