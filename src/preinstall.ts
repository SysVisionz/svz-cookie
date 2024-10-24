import { exec } from 'node:child_process';
import * as fs from 'fs'

const prev = exec("npm list supercookie").stdout.on('data', (data) => {
	const v = data.match(/supercookie@\d.*/)
	if (v) {
		console.log('Previous version:', v[0]);
		fs.writeFileSync ('./prev.tmp',v[0].split('@')[1][0]);
	}
});
