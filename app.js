/*
 *
 *
 *
 * Projet « services web » (Théo Mingorance et Daniel Zhu)
 *
 *
 *
 */

const createError = require('http-errors');
const express = require('express');
const methodOverride = require('method-override')
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const Discord = require('discord.js');
const axios = require('axios');
const fs = require('fs');

const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const chatbotRouter = require('./routes/chatbot');
const apiRouter = require('./routes/api');


const app = express();



// --------------------------------------------------------------------------------------------------------------------
// Paramètres
// --------------------------------------------------------------------------------------------------------------------

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));



// --------------------------------------------------------------------------------------------------------------------
// Routes principales
// --------------------------------------------------------------------------------------------------------------------

app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/chatbot', chatbotRouter);
app.use('/api', apiRouter);



// --------------------------------------------------------------------------------------------------------------------
// Capture des erreurs
// --------------------------------------------------------------------------------------------------------------------

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



// --------------------------------------------------------------------------------------------------------------------
// Discord
// --------------------------------------------------------------------------------------------------------------------

const client = new Discord.Client();
let discord_bot_id = 1;

client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', msg => {

  if (msg.author.bot) return; // Ignorer les messages du bot
  if (msg.content.startsWith("!")) {
    const tmp_id = parseInt(msg.content.match(/\d+/)[0]);
    const chatbot = JSON.parse(fs.readFileSync(`data/chatbots/chatbot_${tmp_id}.json`));

    if (chatbot.discord) {
      msg.channel.send(`Current bot is now *${chatbot.name}* (#${chatbot.id})`);
      client.user.setUsername(chatbot.name);
      discord_bot_id = chatbot.id;
    } else {
      msg.channel.send(`Unfortunately, *${chatbot.name}* (#${chatbot.id}) is not allowed to speak`);
    }
  }
  if (!msg.content.startsWith("?")) return;

  axios.post(`http://localhost:3000/api/chatbot/${discord_bot_id}/user/${encodeURIComponent(msg.author.username)}/messages`, {
    message: msg.content
  }).then(function (response) {
    
    msg.channel.send(response.data.response);
  
  }).catch(function (error) {
  
    console.log(error);
  
  });

});

client.login('NzE5MjIwMzc3MjgwMzE1NTIz.Xt0Tag.cKZdDsRFPI0wIw5_NUJJDTH1QBE');



// --------------------------------------------------------------------------------------------------------------------

module.exports = app;


