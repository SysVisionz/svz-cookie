import * as fs from 'fs';

const exists = fs.existsSync('./prev.tmp')
if (exists) {
	const prev = fs.readFileSync('./prev.tmp', 'utf8');
	console.warn(`You are upgrading from an older version of Supercookie: supercookie@${prev}
Please check the readme for proper utilization, as the module's usage has changed significantly.
Many breaking changes were introduced in version 5.0.0, and the module is now more secure and efficient.`);
}