# Bug Tracker - Guide d'Intégration

Ce guide explique comment intégrer le plugin Bug Tracker dans l'application principale Stomy avec affichage dans la sidebar.

## 🎯 Vue d'Ensemble

Le Bug Tracker ajoute un onglet rouge dans la sidebar de l'application avec :
- **Icône** : Bug (Lucide)
- **Couleur** : Rouge (#ef4444)
- **Position** : Au-dessus du footer de la sidebar
- **Composant** : Panel de soumission de bugs

## 📦 Étapes d'Intégration

### 1. Backend (Rust)

#### Copier le Module Rust

```bash
cp bug-tracker/bug_tracker_commands.rs src-tauri/src/
```

#### Modifier `src-tauri/src/main.rs`

```rust
// Ajouter la déclaration du module
mod bug_tracker_commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // ... autres commandes existantes ...

            // Commandes Bug Tracker
            bug_tracker_commands::github_auth_status,
            bug_tracker_commands::github_create_issue,
            bug_tracker_commands::github_test_connection,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### Configurer `src-tauri/tauri.conf.json`

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

### 2. Frontend (TypeScript/React)

#### Importer le Plugin

Dans `src/plugins/index.ts` :

```typescript
import { bugTrackerPlugin } from './core/bug-tracker';

export async function initializePlugins(): Promise<void> {
  await pluginManager.initialize();

  // ... autres plugins ...

  // Bug Tracker Plugin
  await pluginManager.registerPlugin(bugTrackerPlugin);
}
```

#### Créer le Composant Panel

Créer `src/components/plugins/BugTrackerPanel.tsx` :

```tsx
import React, { useState } from 'react';
import { Bug, Send, AlertCircle } from 'lucide-react';
import { submitBugReport } from '@/plugins/core/bug-tracker';
import { notificationService } from '@/services/notificationService';

export function BugTrackerPanel() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'bug' | 'feature' | 'question' | 'enhancement'>('bug');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      await notificationService.notify({
        title: 'Bug Tracker',
        body: 'Veuillez remplir le titre et la description',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitBugReport({
        title,
        description,
        category,
        severity,
        page: document.title,
        url: window.location.href,
      });

      if (result.success) {
        await notificationService.notify({
          title: 'Bug Tracker',
          body: `Bug soumis avec succès! Issue #${result.issueNumber}`,
        });

        // Reset form
        setTitle('');
        setDescription('');
        setCategory('bug');
        setSeverity('medium');
      } else {
        await notificationService.notify({
          title: 'Bug Tracker',
          body: `Erreur: ${result.error}`,
        });
      }
    } catch (error) {
      console.error('Bug submission error:', error);
      await notificationService.notify({
        title: 'Bug Tracker',
        body: `Erreur lors de la soumission: ${error}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Bug className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Signaler un Bug
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Décrivez le problème rencontré
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Titre du bug *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: L'application plante lors de l'import"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description détaillée *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez le bug en détail : comment le reproduire, ce qui s'est passé, ce qui aurait dû se passer..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Catégorie
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="bug">🐛 Bug</option>
            <option value="feature">✨ Demande de fonctionnalité</option>
            <option value="question">❓ Question</option>
            <option value="enhancement">🚀 Amélioration</option>
          </select>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sévérité
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="low">🟢 Faible</option>
            <option value="medium">🟡 Moyen</option>
            <option value="high">🟠 Élevé</option>
            <option value="critical">🔴 Critique</option>
          </select>
        </div>

        {/* Info Box */}
        <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">Informations collectées automatiquement :</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>Capture d'écran</li>
              <li>Système d'exploitation et version</li>
              <li>Informations du navigateur</li>
              <li>Résolution d'écran</li>
            </ul>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3
                   bg-red-500 hover:bg-red-600 disabled:bg-gray-400
                   text-white font-medium rounded-md
                   transition-colors duration-200"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Soumission en cours...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Soumettre le bug
            </>
          )}
        </button>
      </form>
    </div>
  );
}
```

#### Intégrer dans la Sidebar

Modifier `src/components/Sidebar.tsx` ou le composant qui gère la sidebar :

```tsx
import { Bug } from 'lucide-react';
import { BugTrackerPanel } from './plugins/BugTrackerPanel';
import { pluginManager } from '@/plugins';

export function Sidebar() {
  const [activeTab, setActiveTab] = useState('library');
  const bugTrackerEnabled = pluginManager.isPluginEnabled('bug-tracker');

  return (
    <div className="flex h-full">
      {/* Sidebar Navigation */}
      <div className="w-16 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        {/* Regular tabs */}
        <SidebarTab icon={Library} label="Bibliothèque" active={activeTab === 'library'} onClick={() => setActiveTab('library')} />
        <SidebarTab icon={Settings} label="Paramètres" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />

        {/* Spacer to push bug tracker to bottom */}
        <div className="flex-1" />

        {/* Bug Tracker Tab - positioned above footer */}
        {bugTrackerEnabled && (
          <SidebarTab
            icon={Bug}
            label="Bug Tracker"
            active={activeTab === 'bug-tracker'}
            onClick={() => setActiveTab('bug-tracker')}
            className="bg-red-500 hover:bg-red-600 text-white"
          />
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-2">
          {/* Footer content */}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {activeTab === 'bug-tracker' && <BugTrackerPanel />}
        {/* Other tabs content */}
      </div>
    </div>
  );
}

function SidebarTab({ icon: Icon, label, active, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 flex flex-col items-center justify-center gap-1
        transition-colors duration-200
        ${active ? 'bg-red-100 dark:bg-red-900/20' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}
        ${className}
      `}
      title={label}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs">{label}</span>
    </button>
  );
}
```

### 3. Dépendances

#### Installer html2canvas

```bash
npm install html2canvas
npm install --save-dev @types/html2canvas
```

#### Charger html2canvas Globalement

Dans `src/index.html` ou `src/App.tsx` :

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

Ou via import :

```typescript
import html2canvas from 'html2canvas';
(window as any).html2canvas = html2canvas;
```

### 4. Configuration GitHub

#### Authentification

```bash
# Installer GitHub CLI
brew install gh  # macOS
winget install GitHub.cli  # Windows

# Se connecter
gh auth login

# Accorder permissions
gh auth refresh -s repo -s write:project
```

#### Configuration du Plugin

Dans l'interface de Stomy :
1. Aller dans **Settings > Plugins**
2. Activer **Bug Tracker**
3. Configurer :
   - **GitHub Repo** : `owner/repo` (ex: `izo/Stomy`)
   - **Auto Assign** : Activer
   - **Assignee** : Votre username GitHub
   - **Auto Screenshot** : Activer

## 🎨 Personnalisation

### Couleur de l'Onglet

Modifier dans `BugTrackerPlugin.ts` :

```typescript
sidebar: {
  color: '#ef4444', // Rouge Tailwind red-500
  // Autres couleurs possibles :
  // '#f59e0b' - Orange
  // '#3b82f6' - Bleu
  // '#10b981' - Vert
}
```

### Position

```typescript
sidebar: {
  position: 'bottom', // 'top' ou 'bottom'
}
```

## 🧪 Test de l'Intégration

### 1. Vérifier l'Authentification

Dans Settings > Plugins > Bug Tracker, cliquer sur **"Vérifier authentification GitHub"**.

### 2. Tester la Soumission

Cliquer sur **"Tester soumission de bug"** pour créer une issue de test.

### 3. Vérifier la Sidebar

1. Activer le plugin
2. L'onglet rouge Bug Tracker doit apparaître au-dessus du footer
3. Cliquer dessus pour ouvrir le panel
4. Soumettre un bug de test

## 🐛 Troubleshooting

### L'onglet n'apparaît pas

- Vérifier que le plugin est activé
- Vérifier `showInSidebar: true` dans les settings
- Redémarrer l'application

### Erreur "gh command not found"

```bash
# Installer gh CLI
brew install gh  # macOS
```

### Erreur "not authenticated"

```bash
gh auth login
gh auth refresh -s repo -s write:project
```

### Screenshot ne fonctionne pas

- Vérifier que html2canvas est chargé
- Désactiver temporairement `autoScreenshot` dans les settings

## 📚 Ressources

- [GitHub CLI Docs](https://cli.github.com/manual/)
- [Tauri Shell Allowlist](https://tauri.app/v1/api/config#shellallowlistconfig)
- [html2canvas](https://html2canvas.hertzen.com/)
