module.exports = class SVZCookie {
    constructor(name, parameters = {}) {
        this.value = value;
        this.name = name;
        this.pVals = parameters;
    }
    toJSON = () => {
        return this.value;
    };
    valueOf() {
        return this.value;
    }
    get value() {
        return SVZCookie.get(this.name, true);
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
        SVZCookie.set(this.name, value, this.parameters);
    }
    set expires(value) {
        this.parameters.expires = value;
        ;
        SVZCookie.set(this.name, this.value, this.parameters);
    }
    set path(value) {
        this.parameters.path = value;
        SVZCookie.set(this.name, this.value, this.parameters);
    }
    set domain(value) {
        this.parameters.domain = value;
        SVZCookie.set(this.name, this.value, this.parameters);
    }
    set maxAge(value) {
        this.parameters.maxAge = value;
        SVZCookie.set(this.name, this.value, this.parameters);
    }
    set parameters(parameters) {
        if (parameters.maxAge) {
            parameters.maxAge;
        }
        this.pVals = parameters;
        SVZCookie.set(this.name, this.value, this.parameters);
    }
    set sameSite(value) {
        this.pVals.sameSite = value;
        SVZCookie.set(this.name, this.value, this.parameters);
    }
    delete() {
        SVZCookie.delete(this.name);
    }
    static set(name, value, parameters) {
        var _a;
        if (name && value) {
            switch (value.constructor.name) {
                case 'Object':
                case 'Array':
                    value = `JSON:${JSON.stringify(value)}`;
                case 'Date':
                    value = `${value.constructor.name}:${value.toJSON()}`;
                case 'Number':
                case 'Boolean':
                    value = `${value.constructor.name}:${value}`;
                default:
                    value = typeof value === "object" ? `JSON:${JSON.stringify(value)}` : `String:${value}`;
            }
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
                                cookieString += ((_a = parameters === null || parameters === void 0 ? void 0 : parameters.path) === null || _a === void 0 ? void 0 : _a.charAt(0)) === '/' ? parameters === null || parameters === void 0 ? void 0 : parameters.path : ' /' + (parameters === null || parameters === void 0 ? void 0 : parameters.path) + ';';
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
            let [key, value] = val.split('=');
            if (asPlainObject) {
                return new SVZCookie(key.trim());
            }
            const [identifier, ...decodedVal] = decodeURIComponent(value).split(':');
            value = decodedVal.join(':');
            switch (identifier) {
                case 'Array':
                case 'Object':
                    value = JSON.parse(value);
                case 'Date':
                    value = new Date(value);
                case 'Number':
                    value = Number(value);
                case 'Boolean':
                    value = value === 'true';
            }
            return Object.assign(Object.assign({}, cookie), { [key]: value });
        }, {});
    }
    static delete(name) {
        document.cookie = name + '=null; max-age=0;';
    }
}
//# sourceMappingURL=index.js.map