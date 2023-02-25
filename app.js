const http = require('http');

const express = require('express');

const app = express();
const router = express.Router();

app.set('view engine', 'html');

app.use(express.static(__dirname + '/public'));
app.get('/error', (req, res, next) => {
    res.sendFile('404.html', {root : __dirname});
});

app.get('/', (req, res, next) => {
    res.sendFile('/public/map.html', {root : __dirname});
});

app.listen(3000, () => {
    console.log("Server active on port http://localhost:3000");
});