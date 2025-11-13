# Bug Tracker Plugin

Plugin de feedback intégré permettant aux utilisateurs de soumettre des bugs directement depuis l'application Stomy vers GitHub Issues avec capture automatique du contexte système.

## 🎯 Objectif

- **Réduire la friction** : Les utilisateurs peuvent signaler des bugs sans quitter l'application
- **Contexte complet** : Capture automatique des informations système, écran, WebView
- **Centralisation** : Tous les bugs sont créés comme issues GitHub
- **Assignation automatique** : Attribution automatique au propriétaire du projet
- **Sidebar intégrée** : Onglet rouge avec icône bug accessible à tout moment

## 🏗️ Architecture

### Frontend (TypeScript)

- **BugTrackerPlugin.ts** : Plugin principal avec logique de collecte et soumission
- **types.ts** : Définitions TypeScript pour les bugs et contexte système
- **index.ts** : Point d'entrée du plugin

### Backend (Rust)

- **bug_tracker_commands.rs** : Commandes Tauri pour l'intégration GitHub CLI

### Intégration Sidebar

Le plugin ajoute un onglet rouge dans la sidebar avec :
- **Icône** : `Bug` (Lucide)
- **Couleur** : Rouge (#ef4444)
- **Position** : Au-dessus du footer
- **Composant** : `BugTrackerPanel` (à implémenter dans l'app principale)

## ⚙️ Configuration

### Paramètres du Plugin

```typescript
{
  enabled: true,
  githubRepo: "owner/repo",        // Format: "propriétaire/dépôt"
  autoAssign: true,                // Assignation automatique
  assignee: "username",            // Nom d'utilisateur GitHub
  defaultLabels: ["bug", "auto-reported"],
  autoScreenshot: true,            // Capture d'écran automatique
  collectSystemInfo: true,         // Collecte du contexte système
  showInSidebar: true,             // Afficher dans la sidebar
  sidebarPosition: "bottom"        // Position dans la sidebar
}
```

## 🚀 Installation et Configuration

### 1. Prérequis

Installer GitHub CLI :

```bash
# macOS
brew install gh

# Windows
winget install --id GitHub.cli

# Linux
sudo apt install gh
```

### 2. Authentification GitHub

```bash
# Se connecter
gh auth login

# Accorder les permissions nécessaires
gh auth refresh -s repo -s write:project
```

### 3. Intégration Backend (Rust)

Copier le module Rust dans votre projet Tauri :

```bash
cp bug-tracker/bug_tracker_commands.rs <stomy-project>/src-tauri/src/
```

Ajouter dans `src-tauri/src/main.rs` :

```rust
// Déclaration du module
mod bug_tracker_commands;

// Dans le builder Tauri
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // ... autres commandes ...
            bug_tracker_commands::github_auth_status,
            bug_tracker_commands::github_create_issue,
            bug_tracker_commands::github_test_connection,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 4. Configuration Tauri

Ajouter dans `src-tauri/tauri.conf.json` :

```json
{
  "tauri": {
    "allowlist": {
      "shell": {
        "all": false,
        "execute": true,
        "sidecar": false,
        "open": false,
        "scope": [
          {
            "name": "gh",
            "cmd": "gh",
            "args": true
          }
        ]
      }
    }
  }
}
```

### 5. Dépendances Frontend

Pour la capture d'écran, ajouter html2canvas :

```bash
npm install html2canvas
```

## 📊 Informations Collectées

### Contexte Système

- **Navigateur/WebView** : Type, version, user agent
- **OS** : Système d'exploitation, version, plateforme, architecture
- **Écran** : Résolution, viewport, pixel ratio
- **Locale** : Langue, timezone
- **Connexion** : Type, débit (si disponible)
- **Application** : Version Stomy, version Tauri

### Capture d'Écran

- Format JPEG (qualité 80%)
- Encodée en base64
- Incluse dans le corps de l'issue GitHub

## 📝 Format de l'Issue GitHub

```markdown
[Description du bug fournie par l'utilisateur]

---

## 📋 Contexte

**Catégorie**: bug
**Sévérité**: medium
**Page**: Dashboard
**URL**: app://index.html#/dashboard
**Date**: 13/11/2025 20:30:45
**Source**: Bug Tracker interne (Application Desktop)

## 💻 Environnement utilisateur

**Navigateur**: Chrome 131 (WebView)
**OS**: macOS 15.1.0
**Platform**: MacIntel
**Résolution écran**: 2560x1440
**Viewport**: 1280x720
**Pixel ratio**: 2
**Langue**: fr-FR
**Timezone**: Europe/Paris
**Connexion**: 4g (10 Mbps)
**Version App**: 1.0.0

## 📸 Screenshot

![Screenshot](data:image/jpeg;base64,/9j/4AAQSkZJRg...)
```

## 🎮 Utilisation

### Via la Sidebar

1. Cliquer sur l'onglet **Bug Tracker** (rouge) dans la sidebar
2. Remplir le formulaire :
   - **Titre** : Titre court du bug
   - **Description** : Description détaillée
   - **Catégorie** : bug, feature, question, enhancement
   - **Sévérité** : low, medium, high, critical
3. Cliquer sur **Soumettre**
4. L'issue est créée automatiquement sur GitHub

### Via l'API Programmatique

```typescript
import { submitBugReport } from './core/bug-tracker';

const result = await submitBugReport({
  title: 'Erreur lors de l\'import',
  description: 'L\'application plante lors de l\'import de fichiers EPUB',
  category: 'bug',
  severity: 'high',
  page: 'Import',
  url: window.location.href,
});

if (result.success) {
  console.log(`Issue créée: ${result.issueUrl}`);
} else {
  console.error(`Erreur: ${result.error}`);
}
```

### Via les Actions du Plugin

**Vérifier l'authentification GitHub** :
- Action dans Settings > Plugins > Bug Tracker
- Vérifie si GitHub CLI est authentifié
- Affiche l'utilisateur et les permissions

**Tester la soumission** :
- Soumet un bug de test avec toutes les informations collectées
- Permet de valider la configuration
- Crée une vraie issue sur GitHub

## 🔧 Actions Disponibles

### Actions Paramètres

- **✓ Vérifier authentification GitHub** : Vérifie l'état d'authentification
- **📤 Tester soumission de bug** : Soumet un bug de test complet

### Menu Items

- **⚙️ Paramètres Bug Tracker** : Ouvre les paramètres du plugin

## 📋 Labels Automatiques

Chaque issue GitHub créée reçoit automatiquement :

- **Catégorie** : `bug`, `feature`, `question`, ou `enhancement`
- **Sévérité** : `severity:low`, `severity:medium`, `severity:high`, `severity:critical`
- **Source** : `auto-reported` (pour différencier des issues manuelles)

## 🎨 Intégration UI dans l'Application Principale

### Sidebar Configuration

Le plugin définit une propriété `sidebar` :

```typescript
sidebar: {
  id: 'bug-tracker-tab',
  label: 'Bug Tracker',
  icon: 'Bug',
  position: 'bottom',
  color: '#ef4444', // Tailwind red-500
  component: 'BugTrackerPanel',
}
```

### Composant BugTrackerPanel (à créer dans l'app)

```tsx
import { submitBugReport } from '@/plugins/core/bug-tracker';

export function BugTrackerPanel() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'bug' | 'feature'>('bug');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');

  const handleSubmit = async () => {
    const result = await submitBugReport({
      title,
      description,
      category,
      severity,
      page: 'Current Page',
      url: window.location.href,
    });

    if (result.success) {
      // Notification de succès
      alert(`Bug soumis: ${result.issueUrl}`);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Signaler un bug</h2>

      <input
        type="text"
        placeholder="Titre du bug"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
      />

      <textarea
        placeholder="Description détaillée"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full mb-3 p-2 border rounded h-32"
      />

      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="bug">Bug</option>
        <option value="feature">Feature Request</option>
        <option value="question">Question</option>
      </select>

      <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
        <option value="low">Faible</option>
        <option value="medium">Moyen</option>
        <option value="high">Élevé</option>
        <option value="critical">Critique</option>
      </select>

      <button onClick={handleSubmit} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">
        Soumettre le bug
      </button>
    </div>
  );
}
```

## 🐛 Débogage

### Vérifier GitHub CLI

```bash
# Version
gh --version

# Statut d'authentification
gh auth status

# Tester la connexion API
gh api user
```

### Logs du Plugin

Tous les événements sont loggés avec le préfixe `[BugTrackerPlugin]` :

```javascript
[BugTrackerPlugin] Plugin enabled
[BugTrackerPlugin] GitHub authenticated as: username
[BugTrackerPlugin] Test bug submitted: {...}
```

### Erreurs Communes

**"GitHub CLI non authentifié"** :
```bash
gh auth login
gh auth refresh -s repo -s write:project
```

**"Repository not configured"** :
- Configurer `githubRepo` dans les paramètres du plugin

**"Screenshot capture failed"** :
- Vérifier que html2canvas est installé
- Désactiver `autoScreenshot` si nécessaire

## 🔒 Sécurité

- **Validation des entrées** : Côté client (TypeScript) et backend (Rust)
- **Allowlist limitée** : Seule la commande `gh` est autorisée
- **Pas de credentials stockés** : Utilise GitHub CLI pour l'authentification
- **Transparence** : L'utilisateur voit exactement ce qui est envoyé

## 📊 Fonctionnalités Avancées

### Collecte de Contexte Système

```typescript
const context = collectSystemContext();
// Retourne toutes les infos système
```

### Capture d'Écran Manuelle

```typescript
const screenshot = await captureScreenshot();
// Retourne base64 JPEG
```

### Formatage Manuel

```typescript
const issue = formatGitHubIssue(report, context, appVersion);
// Retourne un objet GitHubIssue
```

## 🚀 Roadmap

- [ ] Support des pièces jointes multiples
- [ ] Historique des bugs soumis
- [ ] Recherche dans les issues existantes
- [ ] Mode offline avec queue de soumission
- [ ] Templates personnalisables
- [ ] Intégration avec d'autres services (Jira, Linear, etc.)
- [ ] Analytics des bugs les plus fréquents

## 📄 Licence

Internal use only - Stomy Team
