# Documentation du Bug Tracker – Application Tauri Desktop

## Vue d’ensemble
Système de feedback intégré permettant aux utilisateurs de soumettre des bugs directement depuis l’application desktop Tauri. Les rapports sont créés comme issues GitHub avec capture de contexte complète.

## Objectif
- Réduire la friction utilisateur
- Capturer le contexte (OS, écran, WebView, etc.)
- Centraliser sur GitHub
- Assignation automatique au propriétaire

## Format de l’issue GitHub
```markdown
[Description du bug]

---
## =Ë Contexte

**Catégorie**: bug  
**Page**: NomApp – Dashboard  
**URL**: app://index.html#/dashboard  
**Date**: 29/10/2025 11:30:45  
**Source**: Bug Tracker interne (Application Desktop)

## =» Environnement utilisateur

**Navigateur**: Chrome 131 (WebView)  
**OS**: macOS 15.1.0  
**Résolution écran**: 2560x1440  
**Viewport**: 1280x720  
**Pixel ratio**: 2  
**Langue**: fr-FR  
**Timezone**: Europe/Paris  
**Connexion**: 4g (10 Mbps)

## =ø Screenshot

![Screenshot](data:image/jpeg;base64,/9j/4AAQSkZJRg...)
```

## Architecture des fichiers Tauri
```
components/FeedbackButton.vue
src-tauri/src/main.rs
src-tauri/tauri.conf.json
docs/BUG_TRACKER_SETUP.md
```

## Commandes Tauri
- `github_auth_status` : vérifie connexion GitHub CLI
- `github_create_issue` : crée une issue avec contexte
- Shell autorisé pour `gh` dans `tauri.conf.json`

## Sécurité
- Validation champs côté client et backend Rust
- Allowlist limitée à `gh`
- Transparence sur les données capturées

## Validation
- Fonctionnel sur macOS, Windows et Linux
- Captures automatiques via html2canvas
- Création d’issues sur GitHub avec labels et assignation
