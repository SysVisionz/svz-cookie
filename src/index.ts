import * as fs from "fs";

export class TempMocks implements TempMocks {
	parent?: TempMocks
	__pathValue?: string
	constructor(path: string, parent?: TempMocks) {
		this.path = path;
		this.parent = parent;
	}

	set path(val: string){
		this.__pathValue = val;
		this.__buildStore(val).then((store: {[path: string]: any}) => this.store = store)
	}

	get path(){
		return `${this.parent?.path ?? __dirname}/${this.__pathValue}`
	}

	__buildStore = (p: string) => new Promise((res, rej) => {
		const parentPath = this.parent?.path ?? __dirname
		const buildFiles = (files: string[]) => new Promise((res, rej) => {
			if (files.length){
				res({})
			} else {
				const fileName = files.pop()
				fs.stat(`${parentPath}/${fileName}`, (err, stats) => {
					if (err){
						rej(err)
					}
					else {
						if (stats.isDirectory){
							res(new TempMocks(fileName, this.root || this as TempMocks))
						}
						else {
							if (fileName.match(/.json$/i)){
								const name = fileName.substring(0, fileName.match(/.json$/i).index)
								this.store[fileName] = {}
							}
						}
					}
				})
			}
		})
		fs.readdir(p, (err, files) => {
			buildFiles(files)
		})
	})

	__readFile = (p: string, obj?: {[value: string]: string}) => {
		return new Promise((res, rej) => {
			fs.readFile(p, 'utf8', (err, data) => {
				if (err){
					rej(err)
				}
				else {
					this.set(p, JSON.parse(data))
					res(JSON.parse(data))
				}
			})
		})
	}

	set = (path: string, object: {[key: string]: string}): void => {
		const p = path.split('/')
		const target = p.pop();
		const toEdit = this.at(p)[target] = object;
	}

	get root(){ return globalThis.TempMocks}
	store: {[path: string]: TempMocks | any};
    at: (subPath: string | string[]) => TempMocks['store'] | {[key: string]: string} = subPath => {
		subPath = typeof subPath === 'string' ? subPath.split('/') : subPath
		if (!subPath.length){
			return this;
		}
		const next = this.store[subPath.shift()];
		return next?.at(subPath) ?? next;
	}
    restore: (subPath?: string) => void;
    get asObject() {
		return Object.keys(this.store).reduce((curr: {[path: string]: any}, key: string) => {
			const val = this.store[key]
			return {...curr, [key]: val?.constructor?.name === 'TempMocks' ? val.asObject : val}
		}, {})
	}
    toJSON: () => TempMocks['asObject'] = () => this.asObject

}

declare global{
	var TempMocks: TempMocks
}

export default (path: string) => {
	globalThis.TempMocks = new TempMocks(path);
}