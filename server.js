require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const url = require('url');

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(process.env.DB_URI, {useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));;
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const Schema = mongoose.Schema;

const urlSchema = new Schema({
  original_url: {type: String, required: true},
  short_url: String
});

let urlModel = mongoose.model("URL", urlSchema);

function hasher() {
  result = "";
  charSet = "abcdefghijklmnopqrstuvwxyz0123456789";
  for (i = 0; i < 9; i++) {
    result += charSet.charAt(Math.floor(Math.random() * charSet.length));
  }
  return result;
};

app.post('/api/shorturl/new', (req, res) => {
  host = url.parse(req.body.url).host;
  href = url.parse(req.body.url).href;
  dns.lookup(host, (err, address) => {
    if (err) {
      return res.send({ error: 'invalid url' });
    } 
    let regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
    if (!req.body.url.toString().match(regex)) {
      return res.send({ error: 'invalid url' });
    }
    let newURL = new urlModel({ original_url: href, short_url: hasher() });
    newURL.save((err, data) => {
      if (err) return console.log(err);
      return res.send(data);
    });
  });
});

app.get('/api/shorturl/:urlTail', (req, res) => {
  db.collection('urls').findOne({ short_url: req.params.urlTail }, (err, foundURL) => {
    if (err) {
      return res.send(err);
    }
    return res.redirect(301, foundURL.original_url.toString());
  })
})
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

