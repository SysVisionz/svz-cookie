import express from 'express';
import http from 'http'
import path from 'path'
import { readFile } from 'fs';

const app = express()

const server = http.createServer(app);

app.get ('*', function(req, res) {
	res.send(`<html>
	<script src="http://localhost:3000/supercookie"></script>
	<body>
		<p id="loaded">Hello there, Clarice</p>
	</body>
</html>`);
})

server.listen(3000, () => {console.log('testing up on 3000')})