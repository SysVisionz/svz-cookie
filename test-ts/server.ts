import express from 'express';
import http from 'http'
import {readFileSync} from 'fs';
import path from 'path';
import * as url from 'url'

const __dirname = url.fileURLToPath(new URL('../', import.meta.url));

const app = express()

const server = http.createServer(app);

let SuperCookie = readFileSync(path.join(__dirname, 'dist/index.js')).toString()
SuperCookie = SuperCookie.replace(/\n.*$/, '').replace(/\n.*$/, '')

app.get ('*', function(req, res) {
	res.send(`<html>
	<script>${SuperCookie}</script>
	<body>
		<p id="loaded">Hello there, Clarice</p>
	</body>
</html>`);
})

server.listen(3000)