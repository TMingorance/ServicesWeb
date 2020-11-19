const express = require('express');
const router = express.Router();

const fs = require ('fs');
//const bodyParser = require('body-parser');

//router.use(bodyParser.urlencoded({extended: false}));
//const userRouter = require('./routes/user');

//router.use('/:botName/user', userRouter)

/* GET interface */
router.get('/', function(req, res, next) {
  res.redirect('http://localhost:3000');
}); 

router.get("/:botId/login", function(req,res,next) {
  const dirpath = './data/chatbots/';
  botInfo = JSON.parse(fs.readFileSync(dirpath + "chatbot_" + parseInt(req.params['botId']) + ".json"));

  res.render('login', {botName : botInfo.name, botId: botInfo.id})
})

module.exports = router;
