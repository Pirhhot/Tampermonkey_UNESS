# 🛠️ Scripts Tampermonkey pour UNESS

Ce dépôt regroupe une collection de scripts utilisateurs (**UserScripts**) conçus pour optimiser, personnaliser et améliorer l'expérience d'utilisation sur la plateforme d'entraînement **[UNESS Annales](https://entrainement.uness.fr/)**.

---

## 📖 Sommaire

- [Tutoriel d'installation](#-tutoriel-dinstallation)
- [Liste des scripts](#-liste-des-scripts)
  - [1. UNESS - Calculateur de Moyenne Pondérée](#1-uness---calculateur-de-moyenne-pondérée)
- [Contributions](#-contributions)

---

## 🚀 Tutoriel d'installation

Pour utiliser ces scripts sur votre navigateur (Chrome, Firefox, Edge, Brave, etc.), vous devez utiliser une extension de gestion de scripts comme **Tampermonkey**.

### 1. Prérequis
1. Installez l'extension **Tampermonkey** sur votre navigateur :
   - [Tampermonkey pour Chrome](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Tampermonkey pour Firefox](https://addons.mozilla.org/fr/firefox/addon/tampermonkey/)

### 2. Ajouter un script personnalisé
Si vous souhaitez lire un guide illustré plus détaillé, vous pouvez consulter ce [Tutoriel complet d'installation de scripts Tampermonkey](https://www.greasyfork.org/fr/help/installing-user-scripts).

**Étapes rapides :**
1. Cliquez sur l'icône **Tampermonkey** dans la barre d'outils de votre navigateur.
2. Choisissez **Créer un nouveau script...**.
3. Copiez-collez le code du script souhaité (présent dans ce dépôt dans le dossier `/scripts/` ou dans la liste ci-dessous).
4. Sauvegardez le script avec `Ctrl + S` (ou `Cmd + S` sur Mac).
5. Rechargez la page UNESS correspondante pour voir les changements !

---

## 📋 Liste des scripts

### 1. UNESS - Calculateur de Moyenne Pondérée

* **Dossier/Fichier :** `scripts/uness-moyenne-ponderee.user.js`
* **Page concernée :** Liste des dossiers d'une épreuve d'annales (`https://entrainement.uness.fr/annales/course/view.php*`)

#### 📝 Description
Sur UNESS, les épreuves se composent de plusieurs dossiers/quiz (SQI, mDP, KFP) comportant chacun un nombre variable de questions. Ce script ajoute un **bouton flottant** au bas de votre écran vous permettant d'analyser en un clic l'ensemble des dossiers de l'épreuve.

#### 🌟 Fonctionnalités :
- **Extraction automatique :** Parcourt en arrière-plan chaque dossier de l'épreuve sans rechargement de page.
- **Pondération exacte :** Calcule une moyenne globale ramenée sur 20, pondérée au prorata du nombre réel de questions par dossier.
- **Support multi-tentatives :** Calcule et affiche séparément vos moyennes si vous avez effectué l'épreuve plusieurs fois (Tentative 1, Tentative 2, etc.).
- **Tableau de synthèse :** Affiche une fenêtre modale synthétique avec le détail note par note et points par points pour chaque dossier.

---

### 💡 Idées de scripts futurs
- 🌙 **Mode Sombre (Dark Theme)** pour réviser la nuit sans se fatiguer les yeux.
- ⌨️ **Raccourcis Clavier** pour naviguer plus rapidement entre les questions.
- 🧹 **Nettoyeur d'interface** pour masquer les éléments superflus de la plateforme pendant les sessions d'entraînement.

---

## 🤝 Contributions

Les propositions d'amélioration, corrections de bugs ou suggestions de nouveaux scripts sont les bienvenues ! N'hésitez pas à ouvrir une *Issue* ou à faire une *Pull Request*.