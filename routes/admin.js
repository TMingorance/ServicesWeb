const express = require('express');
const multer  = require('multer');
const fs      = require('fs');
const axios  = require('axios');
const router = express.Router();
const upload = multer({ dest: 'data/rives/' });

/* GET admin interface */
// Page par défaut
router.get('/', function (req, res, next) {
    const properties = {
        title: 'Administration',
        botList: [],
    }

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

    res.render('admin', properties);
});

// Gérer les accès et les rives d'un bot
router.get('/:bot_id', function (req, res, next) {
    const properties = {
        title: undefined,
        bot: undefined,
        access: [],
    }

    // Vérifier l'existence du chatbot
    const bot_id = parseInt(req.params['bot_id'])
        , data   = fs.readFileSync(`./data/chatbots/chatbot_${bot_id}.json`)
        , bot    = JSON.parse(data);
    
    properties.title = `Accès de ${bot.name}`;
    properties.bot = bot;

    res.render('admin-bot', properties);
});

// Valider une modification d'accès ou une suppression de rive
router.post('/:bot_id', function (req, res, next) {
    const properties = {
        title: undefined,
        bot: undefined,
        access: [],
    }

    // Vérifier l'existence du chatbot
    const bot_id = parseInt(req.params['bot_id'])
        , data   = fs.readFileSync(`./data/chatbots/chatbot_${bot_id}.json`)
        , bot    = JSON.parse(data);
    
    properties.title = `Accès de ${bot.name}`;
    properties.bot = bot;

    // Traitement : Discord
    const access_granted = req.body.authorized === 'on';
    
    if (access_granted) {
        axios.put(`http://localhost:3000/api/chatbot/${bot.id}/access`);
    } else {
        axios.delete(`http://localhost:3000/api/chatbot/${bot.id}/access`);
    }

    // Traitement : Rive
    for (const c in bot.rivescript) {
        
        const filename = bot.rivescript[c]
            , field = req.body[filename];

        if (field === 'on') {
            axios({
                method: 'DELETE',
                url: `http://localhost:3000/api/chatbot/${bot.id}/cerveau`,
                data: {
                    filename: filename,
                    key: c,
                }
            }).catch(e => console.log(e));
        }
    }

    res.redirect(`/admin/${bot.id}`);
});



/* POST admin interface */
// Ajouter un bot
router.post('/', upload.single('createbot_rive'), function(req, res, next) {
    
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
    const name = req.body.createbot_name
        , rive = req.file;
    
    let error = null;
    let success = null;

    if (!error && !(name && rive)) {
        error = "Veuillez indiquer le nom du chatbot ainsi que son fichier .rive !";
    }
    
    if (!error && !(3 <= name.length && name.length <= 20)) {
        error = `Le nom du chatbot doit contenir 3 à 20 caractères ! (actuellement ${name.length})`;
    }
    
    if (!error && !/^(.+).rive$/.test(rive.originalname)) {
        error = `Le fichier téléversé doit être au format .rive !`;
    }

    // Enregistrement du chatbot ici
    if (!error) {
        const path_cbot = "./data/chatbots/"
            , path_rive = "./data/rives/"
            , chatbots_nb = fs.readdirSync(path_cbot).length
            , chatbot   = {
                id: chatbots_nb+1,
                name: name,
                rivescript: {},
                last_activity: 0,
            }
            , filepath = `${path_cbot}chatbot_${chatbots_nb+1}.json`;
        
        chatbot.rivescript[rive.originalname] = rive.filename;
        
        fs.writeFile(filepath, JSON.stringify(chatbot), function (e) {
            if (e) {
                error = `Error: ${e}`;
                fs.unlink(`${path_rive}${rive.filename}`);
            } else {
                success = "Le chatbot a bien été enregistré !";
            }
            
            res.redirect('/admin');
        });
        
    } else {
        properties.merror = error;
        res.render('admin', properties);
        fs.unlink(`data/rives/${rive.filename}`);
    }

});

module.exports = router;
