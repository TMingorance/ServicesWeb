# Services web

Ce projet consiste à gérer des chatbots implémentant des fichiers `rivescript`. Il est réalisé en binôme par Théo Mingorance et Daniel Zhu (INFO2).

Il est impératif que le port utilisé soit 3000.

# Administration

L'accès à l'administration se fait sans authentification au préalable puisque ça n'est pas le cœur du sujet. On y accède en cliquant, depuis la page d'accueil, sur le lien en dessous du tableau intitulé « right here ».

## Ajouter un chatbot

L'ajout d'un chatbot se fait en indiquant simplement le nom et un premier fichier `.rive` dans le premier bloc (en haut à gauche).
Le fichier `.rive` est renommé à l'aide d'une fonction de hashage afin d'éviter d'envoyer plusieurs fichiers avec le même nom sur le serveur ; néanmoins, le nom original du fichier est conservé.

## Ajouter un rive à un chatbot déjà existant

Cela permet d'ajouter d'autres fichiers `.rive` à un chatbot qui a été crée précédemment.
**Attention** : Si l'un des fichiers `.rive` déjà assignés à un chatbot porte le même nom que le fichier nouvellement envoyé, l'ancien sera tout simplement écrasé. Exemple : mon chatbot **A** possède un fichier `.rive` intitulé **monfichier.rive**. Je décide de lui assigner un nouveau fichier intitulé **monfichier.rive**. Dans ce cas, le premier est écrasé par le second.

## Liste des chatbots

Liste les chatbots et les fichiers `.rive` déjà existant. Affiche également pour chaque chatbot leur statut (s'ils ont été actif la dernière minute) ainsi que leur dernière heure d'activité.

Enfin, pour chaque chatbot, il est possible de révoquer ou d'accorder l'accès à Discord en cliquant sur « Accès ». De là, on peut également supprimer un ou plusieurs fichiers `.rive` associés à un chatbot.

# Discuter avec un chatbot depuis l'interface du site

Sur la page d'accueil, choisissez un robot dans le tableau en cliquant sur "Connect".

Choisissez ensuite un pseudonyme puis validez puis vous pourrez dialoguer avec le chatbot.

# Discuter avec un chatbot depuis Discord

La commande `!n` permet d'indiquer que l'on veut discuter avec le chatbot dont l'ID vaut `n`. **Il est impératif que le chatbot en question soit autorisé d'accès à Discord ! (par défaut : accès interdit)**

Pour dialoguer avec le chatbot, faire précéder votre message par `?`. Exemple : `?Hello there!`.

Ajouter les bot sur votre serveur : https://discord.com/oauth2/authorize?client_id=719220377280315523&scope=bot

Tester les bots sur un serveur temporaire : https://discord.gg/JHN3rKx

# Respect de l'architecture REST

L'architecture REST de notre site est décrit dans le fichier suivant : https://docs.google.com/spreadsheets/d/1WSDkfIxxufqDX3mviWef0r6Mrrzi18LIWyr4-oCjRkY/edit?usp=sharing

Il convient de noter que les adresses "web" et les adresses "REST" ne coïncident pas nécessairement depuis le navigateur web. L'utilisation du paquet **Axios** est utilisé afin de forger les requêtes REST depuis le serveur directement.

Ainsi, notre architecture décrite dans le document ci-dessus est respecté.