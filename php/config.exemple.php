<?php
/**
 * Configuration du formulaire — MODÈLE.
 *
 * Copier ce fichier SUR LE SERVEUR, hors du site, sous le nom :
 *   ~/config/<dossier-du-site>.php        ex. ~/config/63ejo2rs1s.php
 * puis remplir les valeurs. Ne jamais le mettre dans le dépôt Git.
 */
return [
    'nom_site' => 'Artech paysages',

    // Boîte d'envoi dédiée (créée chez OVH). Son mot de passe ne sert qu'ici.
    // Sur le serveur xmediacreation, « xm-site envoi <nom> » crée ~/config/www.envoi.php
    // (Scaleway Transactional Email) qui remplace ce bloc et l'adresse d'expéditeur.
    'smtp' => [
        'hote'         => 'ssl0.ovh.net',       // serveur SMTP indiqué par OVH pour votre offre mail
        'port'         => 465,
        'chiffrement'  => 'ssl',                // 'ssl' (port 465) ou 'tls' (port 587)
        'utilisateur'  => 'formulaire@exemple.fr',
        'mot_de_passe' => 'A-REMPLIR',
    ],
    'expediteur'    => ['email' => 'formulaire@exemple.fr', 'nom' => 'Site Artech paysages'],
    'destinataires' => ['contact@exemple.fr'],

    // Domaines depuis lesquels le formulaire peut être envoyé
    'hotes_autorises' => ['artech-ubaye.fr'],

    // Chaîne aléatoire (anonymise les adresses IP dans les limites d'envoi)
    'sel' => 'A-REMPLIR-par-une-chaine-aleatoire',

    // Facultatif : journal des envois et refus (hors du site), dossier des limites
    'journal'         => __DIR__ . '/formulaire.log',
    'dossier_limites' => __DIR__,

    'message_succes' => 'Merci, votre demande a bien été envoyée. Nous revenons vers vous sous 48 h.',

    // ------------------------------------------------------------------
    // Decap CMS (/admin/) : application OAuth GitHub (voir DEPLOIEMENT.md)
    // ------------------------------------------------------------------
    'decap' => [
        'client_id'     => 'A-REMPLIR',
        'client_secret' => 'A-REMPLIR',
    ],

    // ------------------------------------------------------------------
    // Espace client xmedia·ai (/xmedia-ai/). Supprimer ce bloc pour le désactiver.
    // ------------------------------------------------------------------
    'xmedia_ai' => [
        'url_site' => 'https://artech-ubaye.fr',

        // Comptes du client. Hash à générer sur le serveur (voir DEPLOIEMENT.md), jamais le mot de passe en clair.
        'utilisateurs' => [
            ['email' => 'contact@exemple.fr', 'nom' => 'Prénom Nom', 'hash' => 'A-REMPLIR'],
            // 'editeur' => true : affiche aussi « Modifier le site » (éditeur /admin/, compte GitHub requis).
            // L'adresse email_agence l'a toujours.
        ],
        'email_client' => 'contact@exemple.fr',            // reçoit : demande reçue, questions, mise en ligne
        'email_agence' => 'dmeyer@xmediacreation.net',     // reçoit : propositions à valider, incidents

        'demandes_par_mois'     => 4,   // demandes lancées incluses dans l'abonnement
        'demandes_ouvertes_max' => 5,
        'echanges_max'          => 12,  // messages du client par demande, pendant le cadrage
        'photos_max'            => 10,
        'photo_max_mo'          => 25,

        'sel'            => 'A-REMPLIR-chaine-aleatoire',
        'secret_webhook' => 'A-REMPLIR-identique-au-secret-GitHub-XMEDIA_AI_SECRET',

        'claude' => [
            'cle_api' => 'A-REMPLIR (sk-ant-...)',
            'modele'  => 'claude-sonnet-5',
            'simulation' => false,
        ],
        'github' => [
            'depot' => 'loopy117/artech-ubaye',
            'jeton' => 'A-REMPLIR (github_pat_...)',     // jeton fine-grained limité à ce dépôt
            'simulation' => false,
        ],
    ],
];
