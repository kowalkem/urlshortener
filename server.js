'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const cors = require('cors');
const dns = require("dns");
const dotenv = require("dotenv");

const app = express();
dotenv.config();
// Basic Configuration 
const port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log("Connection to mongoDB Successful!");
});

const urlSchema = new mongoose.Schema({
  url: String,
  shortUrl: Number
});
const URL = mongoose.model("URL", urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use(bodyParser.urlencoded({extended: false}));
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/api/shorturl/:shortUrl", (req, res) => {
  URL.findOne({shortUrl: req.params.shortUrl}, (err, data) => {
    if (err) console.log(err);
    if (!data) {
      res.json({error: "no record for specified short url"});
    } else {
      res.redirect(data.url);
    }
  });
});

app.post("/api/shorturl/new", (req, res) => {
  let url = req.body.url.replace(/https?:\/\//, "");
  dns.lookup(url, (err, address, family) => {
    if (address) {
      const ipArr = address.match(/\d+/g);
      const shortUrl = ipArr.map((item) => Number(item)).reduce((total, item) => total + item);
      const newUrl = new URL({url: req.body.url, shortUrl: shortUrl});
      URL.findOne({shortUrl: shortUrl}, (err, data) => {
        if (err) console.log(err);
        if (!data) {
          newUrl.save((err, data) => err ? console.log(err) : data);
        }
      });
      return res.json({original_url: req.body.url, short_url: shortUrl});
    }
    return res.json({error: "invalid URL"});
  });
});


app.listen(port, () => console.log("Server is listening on port: " + port));