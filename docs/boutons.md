# Boutons et appels à l'action

Règle : le libellé dit ce que le visiteur obtient. Test : « Je veux [libellé] » est une phrase naturelle et le clic la tient tout de suite. Contrastes mesurés dans Chrome (production locale, thèmes clair et sombre, repos et survol).

| Où | Stade | Avant | Après | Gain |
|---|---|---|---|---|
| Accueil, écran 1 | Découverte | Continuer | Découvrir les astuces de nuit | l'écran suivant montre toilettes, alcool, RDV, mode SAM |
| Accueil, écran 2 | Découverte | Continuer | Découvrir la communauté | l'écran suivant présente rencontres, messagerie, covoiturage |
| Compte à la création | Décision | Créer mon compte | Débloquer la communauté | le compte ouvre la communauté (dit à l'écran) |
| Quitter l'accueil | Décision | Continuer sans compte | Ouvrir l'appli sans compte | entrée directe |
| Compte, inscription | Décision | Créer mon compte | Débloquer la communauté | idem |
| Compte, connexion | Décision | Me connecter | Retrouver ma communauté | idem |
| Compte, soutien | Décision | Passer Festayre+ | Synchroniser mes favoris | Festayre+ synchronise les favoris (dit dans la carte) |
| Communauté, non connecté | Décision | Se connecter en 30 secondes | Rejoindre la communauté | le délai n'était écrit nulle part ailleurs |

Fonctionnels inchangés : Passer, Connexion, Inscription, Créer, Rejoindre le groupe, Partager, Envoyer, Publier, Alerte, Appeler, Annuler.

## Contrastes corrigés

| Élément | Avant | Après |
|---|---|---|
| Texte blanc sur rouge, thème sombre | 3,1:1 | 5,6:1 (texte `#0d1526`, jeton `on-fill`) |
| Texte blanc sur navy et vert, thème sombre | environ 2,2:1 | au moins 5,6:1 |
| Bordure des boutons et cartes cliquables, clair | 1,2:1 | 3,7:1 (jeton `edge`) |
| Bordure idem, sombre | 1,5:1 | 3,3:1 (jeton `edge`) |
| Carte « Mon groupe » | bordure rouge à 40 % : 2,2:1 clair, 1,8:1 sombre | bordure rouge pleine |

Reste : les boutons + et - du zoom de carte (Leaflet) ne sont pas stylés par le projet.
