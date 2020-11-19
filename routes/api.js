const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const fs = require('fs');
const RiveScript = require('rivescript');
const multer  = require('multer');
const upload = multer({ dest: 'data/rives/' });
const mongodb = require('mongodb');
const MongoClient = require('mongodb').MongoClient;

const tempsDeconnexion = 60000

var botTable = {}

var registerDataTimeout = [];

router.use(bodyParser.urlencoded({extended: true}));

/* GET api interface */
router.get('/chatbot', function(req, res, next) {//ptet pas besoin
  res.json(chatbots);
});

// Renvoi du statut
router.get('/chatbot/:botId/state', function(req,res, next) {
  const bot_id = parseInt(req.params['botId'])
      , filepath = "data/chatbots/chatbot_" + bot_id + ".json"
      , rawdata = fs.readFileSync(filepath)
      , chatbot = JSON.parse(rawdata)
      , now = new Date();
  

  const online = (now - Date.parse(chatbot.last_activity)) <= 60000;
  
  // retourne le statut en ligne ou non et la date de dernière activité
  res.json({online: online, last_activity_from_now: (Number(((new Date() - Date.parse(bot.last_activity)) / 60000).toFixed(0)))});
});

//Get de l'interface de messagerie
router.get('/chatbot/:botId/user/:userName', function (req,res,next) {
  const filepath = './data/chatbots/chatbot_' + parseInt(req.params['botId']) + '.json';
  const properties = {
    bot: JSON.parse(fs.readFileSync(filepath)),
    userName: req.params['userName']
  };
  res.render('messagerie', properties);
});



/* POST api interface */
// Login
//********************************* mettre un chrono à la connexion pour que le bot se déconnexte au bout d'un moment si on ne lui parle pas *************
router.post('/chatbot/:botId/user', function(req, res, next) {
  // Vérifier les saisies
  const username = req.body.login
  console.log("connexion de " + username)
  
  let error = null;
  let success = null;

  if (!error && !username) {
      error = "Veuillez indiquer votre pseudo !";
  }
  
  if (!error && !(3 <= username.length && username.length <= 20)) {
      error = `L'identifiant doit contenir 3 à 20 caractères ! (actuellement ${username.length})`;
  }

  if(!error && /[^a-zA-Z0-9_\-]/.test(username)){
    error = 'Seuls les caractères alphanumériques ainsi que "_" et "-" sont autorisés !'
  }

  if (!error){
    botId = req.params["botId"];
    if(botTable[botId] == undefined){
      const bot = new RiveScript({
        utf8:true,
      });
      getUserVarsFromDB(bot, username);
      botTable[botId] = bot
    }
    res.redirect("http://localhost:3000/api/chatbot/" + req.params['botId'] + "/user/" + username)
  }
  else{
    res.render('login', { merror : error })
  }
  
});

// Poster un message
router.post('/chatbot/:botId/user/:userName/messages', function (req, res,next) {

  const botId = req.params["botId"]
  const bot = botTable[botId];

  const botDetails = JSON.parse(fs.readFileSync('./data/chatbots/chatbot_' + req.params['botId'] + '.json'));
  const rivefile = [];
  
  for (const rive in botDetails.rivescript){ 
    // console.log("loading brain " + botDetails.rivescript[rive])
    // bot.loadFile("./data/rives/" + botDetails.rivescript[rive]).catch(loading_error);
    rivefile.push("./data/rives/" + botDetails.rivescript[rive]);
  }
  

  bot.loadFile(rivefile).then(loading_done).catch(loading_error); //sorting replies
  
  function loading_done() {
    bot.sortReplies();
    const username = req.params["userName"];

    bot.reply(username, req.body.message).then(function(reply) {
      console.log("The bot says: " + reply);

      if(registerDataTimeout[botDetails.id] != undefined){
        clearTimeout(registerDataTimeout[botDetails.id]);
      }
      registerDataTimeout[botDetails.id] = setTimeout(botDeconnection, tempsDeconnexion, bot, botDetails, req.params["userName"]);
      res.json({from : botDetails.name, response : reply});

      // Mise à jours du timestamp de la dernière activité
      botDetails.last_activity = new Date();
      fs.writeFileSync('./data/chatbots/chatbot_' + req.params['botId'] + '.json', JSON.stringify(botDetails));
    });
  }

  function loading_error(error, filename, lineno) {
    console.log("Error when loading files for " + req.params["botId"] + " : " + error);
  }


})


/* PUT api interface */
// Ajouter un .rive à un bot (activée avec ?_method=PUT)
router.put('/chatbot/:botId/cerveau', upload.single('addfile_name'), function(req, res, next) {

  const properties = {
      title: 'Administration',
      botList: [],
  };

  // Liste des bots
  const dirpath = './data/chatbots/';
  for (const file of fs.readdirSync(dirpath)) {
      const bot = JSON.parse(fs.readFileSync(dirpath + file));
      const now = new Date(); // Millisecondes depuis le 1er janvier 1970
      
      // Un bot est en ligne s'il a été actif la dernière min
      bot.online = {
          online: (now - Date.parse(bot.last_activity)) <= 60000,
          last_activity_from_now: (Number(((new Date() - Date.parse(bot.last_activity)) / 60000).toFixed(0)))
      };
      
      properties.botList.push(bot);
  }
  
  // Vérifier les saisies
  const bot  = req.body.addfile_chatbot
      , rive = req.file;
  
  let error = null;
  let success = null;

  if (!error && !(bot && rive)) {
      error = "Veuillez indiquer le chatbot ainsi que son fichier .rive !";
  }
  
  if (!error && isNaN(bot)) {
      error = `La saisie du chatbot est incorrecte !`;
  }
  
  if (!error && !/^(.+).rive$/.test(rive.originalname)) {
      error = `Le fichier téléversé doit être au format .rive !`;
  }

  // Enregistrement du chatbot ici
  if (!error) {
      const chatid = parseInt(bot)
          , path_cbot = "./data/chatbots/"
          , path_rive = "./data/rives/"
          , filepath = `${path_cbot}chatbot_${chatid}.json`
          , chatbot  = JSON.parse(fs.readFileSync(filepath));
      
      chatbot.rivescript[rive.originalname] = rive.filename;
      
      fs.writeFile(filepath, JSON.stringify(chatbot), function (e) {
          if (e) {
              error = `Error: ${e}`;
              fs.unlink(`${path_rive}${rive.filename}`);
          } else {
              success = "Le fichier a bien été ajouté au chatbot !";
          }
          
          properties.perror = error;
          res.redirect('/admin');
      });
      
  } else {
      properties.perror = error;
      res.render('admin', properties);
      fs.unlink(`data/rives/${rive.filename}`);
  }

});
// Supprimer un .rive à un bot
router.delete('/chatbot/:botId/cerveau', function(req, res, next) {
  
  const bot_id = parseInt(req.params["botId"])
      , bot = JSON.parse(fs.readFileSync(`data/chatbots/chatbot_${bot_id}.json`))
      , filename = req.body.filename
      , key = req.body.key;
  
  fs.unlink(`data/rives/${filename}`, function (e) {
    if (e) {
      console.log(e);
    }

    delete bot.rivescript[key];

    fs.writeFileSync(`data/chatbots/chatbot_${bot_id}.json`, JSON.stringify(bot));
    
    res.json({ result: true });
  })
  
});


function getUserVarsFromDB(bot, user){

  const uri = 'mongodb+srv://admin:admin@cluster0-plgdb.mongodb.net/ChatBots?retryWrites=true&w=majority'

    const client = new MongoClient(uri, { useUnifiedTopology: true, useNewUrlParser : true });

    client.connect((err, client) => {
      if (err) throw err
      
      var db = client.db('ChatBots');
      
      db.collection('UserVars').find({user : user}).toArray((err,result) => {
        if (err) throw err

        bot.setUservars(user, result[0].result);


      })
    })
}

function botDeconnection (bot, botDetails, user){
  console.log("Deconnection du bot " + botDetails.id);

  if(botDetails.last_activity - (new Date()) < tempsDeconnexion -1 ){
    //enregistrer les infos
    const uri = 'mongodb+srv://admin:admin@cluster0-plgdb.mongodb.net/ChatBots?retryWrites=true&w=majority'

    const client = new MongoClient(uri, { useUnifiedTopology: true, useNewUrlParser : true });

    client.connect((err, client) => {
      if (err) throw err
      
      var db = client.db('ChatBots');
      

      bot.getUservars(user).then((result) => {


        db.collection('UserVars').find({user : user}).toArray((err,result2) => { //on cherche si un champ ayant le username existe
          if (err) throw err
          if (result2.length == 0){//si non, on le crée
            db.collection('UserVars').insertOne({user : user, result});
          }
          else{//si oui on remplace
            db.collection("UserVars").replaceOne({user : user}, {user : user, result});
          }
  
          delete botTable[botDetails.id]
        });

      }).catch((err) => console.error("erreur lors de l'appel à getUserVars() : " + err))
      

    })
  }
  else{
    if(registerDataTimeout[botDetails.id] != undefined){
      clearTimeout(registerDataTimeout[botDetails.id]);
    }
    registerDataTimeout[botDetails.id] = setTimeout(botDeconnection, tempsDeconnexion, bot, botDetails, user)
  }

}

/* Accorder le droit d'accès à Discord à un bot */
router.put("/chatbot/:bot_id/access", function (req, res, next) {

  // Vérifier l'existence du chatbot
  const bot_id = parseInt(req.params['bot_id'])
      , data   = fs.readFileSync(`./data/chatbots/chatbot_${bot_id}.json`)
      , bot    = JSON.parse(data);
  
  // Mise à jours puis envoi
  bot.discord = true;
  fs.writeFileSync(`data/chatbots/chatbot_${bot.id}.json`, JSON.stringify(bot));
  res.json({ result: true });

});

/* Révoquer le droit d'accès à Discord à un bot */
router.delete("/chatbot/:bot_id/access", function (req, res, next) {

  // Vérifier l'existence du chatbot
  const bot_id = parseInt(req.params['bot_id'])
      , data   = fs.readFileSync(`./data/chatbots/chatbot_${bot_id}.json`)
      , bot    = JSON.parse(data);
  
  // Mise à jours puis envoi
  bot.discord = false;
  fs.writeFileSync(`data/chatbots/chatbot_${bot.id}.json`, JSON.stringify(bot));
  res.json({ result: true });
  
});

module.exports = router;
