/*
 *
 *
 *
 *  Script client de l'administration
 *
 *
 *
 */

"use strict";

// Ce script permet de modifier l'adresse du FORM lorsque l'on ajoute un fichier .rive à un chatbot (permettant 
// d'obtenir la bonne adresse)

window.addEventListener("load", function () {
    const bot_field = document.getElementById("addfile_chatbot")
        , form = document.getElementById("addriveform");

    bot_field.addEventListener("click", function () {
        form.action = `/api/chatbot/${bot_field.value}/cerveau?_method=PUT`;
        console.log(`chatbotid: ${bot_field.value}`);
    })
});