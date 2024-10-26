import express from 'express';
import http from 'http'
import path from 'path'
import { readFile } from 'fs';

const app = express()

const server = http.createServer(app);

app.get('/supercookie', (req, res) => readFile('../dist/index.js', (err, data) => {res.send(data.toJSON())}))

app.get ('*', function(req, res) {
	res.sendFile('index.html', {root: path.join(__dirname, '/tests/')});
})

server.listen(3000, () => {console.log('testing up on 3000')})