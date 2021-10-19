class SVZCookie {

	constructor(name){
		this.name = name;
		this.pVals = {};
	}

	toJSON = () => {
	    return this.value
    }

	get value(){
		return this.constructor.get(this.name)
	}

	get path(){
		return this.parameters.path;
	}
	get domain(){
		return this.parameters.domain;
	}

	get expires(){
		return this.parameters.expires;
	}
	
	get secure(){
		return this.parameters.secure;
	}
	get maxAge(){
		return this.parameters.maxAge;
	}
	get sameSite(){
		return this.parameters.sameSite;
	}

	get parameters(){
		return this.pVals;
	}

	set value (value) {
		return this.constructor.set(this.name, value, this.parameters);
	}

	set expires(value){
		this.parameters.expires = value;;
		this.constructor.set(this.name, this.value, this.parameters)
	}

	set path(value){
		this.parameters.path = value;
		this.constructor.set(this.name, this.value, this.parameters)
	}

	set domain(value){
		this.parameters.domain = value;
		this.constructor.set(this.name, this.value, this.parameters)
	}

	set maxAge(value){
		this.parameters.maxAge = value;
		this.constructor.set(this.name, this.value, this.parameters)
	}

	set parameters(parameters){
		this.pVals = parameters;
		this.constructor.set(this.name, this.value, this.parameters)
	}

	set sameSite(value){
		this.pVals.sameSite = value;
		this.constructor.set(this.name, this.value, this.parameters)
	}

	delete(){
		this.constructor.delete(this.name)
	}

	static set (name, value, parameters) {
		if (typeof value === 'object'){
			value = JSON.stringify(value)
		}
		if (name && value){
			let cookieString = name + '=' + value + ';';
			if (parameters){
				for (const i in parameters){
					if (i === 'expires'){
						const date= typeof parameters.expires === 'object' ? parameters.expires : new Date(parameters.expires);
						cookieString += ' expires=' + date.toUTCString() + ';';
					}
					if (i === 'path'){
						cookieString += parameters.path.charAt(0) === '/' ? parameters.path : ' /' + parameters.path + ';';
					}
					if (i === 'secure'){
						cookieString += ' secure;';
					}
					if (i === 'sameSite'){
						cookieString += ' samesite='+parameters.sameSite + ';';
					}
					if (i === 'maxAge'){
						cookieString += ' max-age='+parameters.maxAge + ';';
					}
				}
			}
			document.cookie = cookieString;
		}
		else {
			throw 'TypeError: Requires (name, value, [parameters]) arguments';
	    }
	}

    static get (name) {
		const cookieStrings = (decodeURIComponent(document.cookie).split(';')).map(a => a.trim());
		for ( let i in cookieStrings) {
			i = Number.parseInt(i);
			let curr = cookieStrings[i].trim();
			if (curr.indexOf(name) === 0){
				curr = curr.substring(name.length);
				try {
					return JSON.parse(curr)
				}
				catch {
    				return curr;
				}
			}
		}
	}

	static getFull(){
		return decodeURIComponent(document.cookie).split(';').map(a => {
			return new this(a.trim().substr(0, a.trim().indexOf('=') ))
		})
    }

    static delete(name) {
    	document.cookie= name+'=null; max-age=0;'
    }

}

SVZCookie.prototype.valueOf = function(){
	return this.value
}

module.exports = SVZCookie