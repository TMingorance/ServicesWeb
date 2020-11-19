/*
 *
 *
 *
 *  Script client de la messagerie
 *
 *
 *
 */

"use strict";


// --------------------------------------------------------------------------------------------------------------------
// Classe représentant la messagerie
// --------------------------------------------------------------------------------------------------------------------

class Chat {

    /**
     * @constructor
     * @param {Object} form Formulaire d'envoi de messages
     * @param {Object} input Champ de texte envoyant les messages
     * @param {Object} write Liste où apparaissent les messages
     */
    constructor(form, input, write) {
        this.url = form.action; // Adresse URL où la requête est envoyée (indiquée directement dans le form)
        this.field = input;     // Champ de texte envoyant les messages
        this.messageslist = write;
        this.running = false;   // L'envoi et la réception de message ne se fait que s'il vaut `true`
        
        // L'envoi du formulaire ne se fait plus par un rechargement de page mais par l'API fetch() via la méthode
        // send() de la classe Chat
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            this.field.focus();  // Le champ doit garder le curseur même après avoir envoyé un message
            this.send();
            return false;
        }.bind(this));
    }

    /**
     * Active le chat (envoi de messages désormais autorisés)
     */
    run() {
        this.running = true;
    }

    /**
     * Envoi de message (à la condition que this.running vaut true)
     */
    send() {
        if (!this.running) { throw Error("La messagerie n'a pas encore été activée !"); }
        if (!this.field.value) { return; }
        
        const input = this.field.value; // Enregistrer la valeur du champ de texte
        this.field.value = null;        // Vider le champ de texte

        // Écrire le message envoyé dans le chat
        this.write(null, input);

        // Envoi du message au serveur
        const headers = {
            'Content-Type': 'application/json'
        };

        fetch(this.url, { headers: headers, method: "POST", body: JSON.stringify({ message: input }) })
            .then(response => response.json())
            .then(data => {
                
                // Écrire la réponse dans le chat
                this.write(data.from, data.response);

            });
    }

    /**
     * Écris un message dans le chat. L'utilisation de createTextNode nous assure qu'il n'y aura pas d'attaques XSS
     * puisque les balises HTML seront considérés comme du simple texte.
     * @param {string} author Auteur du message à écrire
     * @param {string} message Contenu du message à écrire
     */
    write(author, message) {
        const li = document.createElement("li")
            , from = document.createElement("span");
        
        // Auteur du message : soit le bot, soit l'utilisateur
        author = (author) ? author : "Vous";
        
        // Indiquer l'auteur d'un message
        from.setAttribute("class", "msg_author");
        from.appendChild(document.createTextNode(author));

        // Ajouter l'auteur et le contenu du message dans la liste des messages
        li.appendChild(from);
        li.appendChild(document.createTextNode(message));
        this.messageslist.appendChild(li);

        // Bar de défilement vers le bas à l'écriture d'un message
        this.messageslist.scrollTop = this.messageslist.scrollHeight;
    }
}



// --------------------------------------------------------------------------------------------------------------------
// Exécution du script après le chargement de la page
// --------------------------------------------------------------------------------------------------------------------

window.addEventListener("load", function () {
    const input = document.getElementById("inputMessage")   // Champ de texte
        , form = document.getElementById("form")            // Formulaire
        , write = document.getElementById("messages")       // Liste des messages

        , chat = new Chat(form, input, write); // Instance du chat
    
    chat.run(); // Activation du chat
});
