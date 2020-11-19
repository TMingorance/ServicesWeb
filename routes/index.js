var express = require('express');
var router = express.Router();
const fs = require ('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
  const properties = {
    title: 'Index',
    botList: [],
  }

  // Liste des bots
  const dirpath = './data/chatbots/';
  for (const file of fs.readdirSync(dirpath)) {
    properties.botList.push(JSON.parse(fs.readFileSync(dirpath + file)));
  }

  res.render('index', properties);
});

module.exports = router;
