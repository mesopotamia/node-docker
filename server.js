'use strict';

const express = require('express');
const mongoose = require('mongoose');
//DB setup
mongoose.connect("mongodb://mongo:27017");

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.get('/', (req, res) => {
    res.send('Hell world\n');
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);