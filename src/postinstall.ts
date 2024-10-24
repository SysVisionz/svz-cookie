import * as fs from 'fs';

const exists = fs.existsSync('./prev.tmp')
let prev = 0;
if (exists){
	prev = Number(fs.readFileSync('./prev.tmp', 'utf8'))
	fs.unlink('./prev.tmp', err => {
		if (err){
			console.warn(`failed to remove ./prev.tmp file, please delete it manually, it doesn\'t do anything now.
`)
		}
	})
}
if (prev < 5){
	console.warn(`You ${exists ? `are upgrading from an older version of Supercookie: supercookie@${prev}` : `may be upgrading from a version of Supercookie older than 5.0.0.`}
Please check the readme for proper utilization, as the module's usage has changed significantly.
Many breaking changes were introduced in version 5.0.0, and the module is now more secure, functional and efficient.`);
}