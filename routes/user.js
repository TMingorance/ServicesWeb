var express = require('express');
var router = express.Router();

router.put('/', function(req, res, next) { //login
  // Vérifier les saisies
  const username = req.body.login
  
  let error = null;
  let success = null;

  if (!error && !username) {
      error = "Veuillez indiquer votre pseudo !";
  }
  
  if (!error && !(3 <= username.length && username.length <= 20)) {
      error = `L'identifiant doit contenir 3 à 20 caractères ! (actuellement ${username.length})`;
  }

  if(!error && /[^a-zA-Z0-9_\-]/.test(username)){
    error = 'Seuls les caractères alphanumériques ainsi que "_" et "-" sont autorisés'
  }

  if (!error){
    res.redirect("http://localhost:3000/api/chatbot/" + req.param(botId) + "/user/" + username)
  }
  
})

router.get('/:username', function(req, res){
  res.render ("WIP messagerie pour l'utilisateur" + req.params.username)
})

module.exports = router;
