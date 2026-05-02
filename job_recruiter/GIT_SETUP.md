# Git & Version Control Setup

This guide helps you set up Git for the Bond AI Clone project.

---

## 📦 Initialize Git Repository

```bash
# From project root
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Bond AI Clone project setup"
```

---

## 📋 .gitignore Configuration

Create a `.gitignore` file in your project root:

```
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment variables
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
.next/

# Development
.DS_Store
.vscode/
.idea/
*.swp
*.swo
*~

# Logs
npm-debug.log*
yarn-debug.log*
*.log

# IDE
.vs/
.vscode/
*.iml

# OS
Thumbs.db
.DS_Store

# Testing
coverage/
.nyc_output/

# Temporary
tmp/
temp/
```

---

## 🌿 Creating Branches

### Main Development Flow
```bash
# Create feature branch from main
git checkout -b feature/navbar-component

# Make changes...

# Stage and commit
git add .
git commit -m "feat: add navbar component with mobile support"

# Push to remote
git push origin feature/navbar-component

# Create Pull Request on GitHub
```

### Branch Naming Conventions
```
feature/feature-name         # New features
bugfix/bug-description       # Bug fixes
hotfix/urgent-fix            # Production fixes
docs/documentation           # Documentation
refactor/component-cleanup   # Code refactoring
```

---

## 📝 Commit Message Format

Use conventional commits for clarity:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, missing semicolons, etc.
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding tests
- `chore` - Maintenance tasks

### Examples
```bash
git commit -m "feat(chat): add typing indicator animation"
git commit -m "fix(api): handle LinkedIn API rate limiting"
git commit -m "docs: update README with setup instructions"
git commit -m "refactor(components): extract common UI components"
```

---

## 🔄 Keeping Branches Synced

```bash
# Update local main
git checkout main
git pull origin main

# Rebase feature branch on latest main
git checkout feature/your-feature
git rebase main

# Force push if needed (be careful!)
git push origin feature/your-feature --force-with-lease
```

---

## 🤝 Pull Request Checklist

Before creating a PR:
- [ ] Code follows project style guide
- [ ] All tests pass
- [ ] Added/updated documentation
- [ ] Commit messages are descriptive
- [ ] Branch is up-to-date with main
- [ ] No console errors or warnings
- [ ] Tested on mobile and desktop

---

## 🚀 Deployment Branches

- **main** - Production ready code
- **develop** - Integration branch for features
- **staging** - Pre-production testing

---

## 📊 Useful Git Commands

```bash
# View status
git status

# View commit history
git log --oneline

# See changes
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Stash changes
git stash

# Apply stashed changes
git stash pop

# Merge branch
git merge feature/branch-name

# Delete branch
git branch -d feature/branch-name
```

---

## ⚙️ Git Configuration

```bash
# Set your name
git config --global user.name "Your Name"

# Set your email
git config --global user.email "your.email@example.com"

# Set default branch name
git config --global init.defaultBranch main

# Enable color output
git config --global color.ui true
```

---

## 🔗 GitHub Setup

1. Create repository on GitHub
2. Add remote:
   ```bash
   git remote add origin https://github.com/username/bond-ai-clone.git
   ```
3. Push initial commit:
   ```bash
   git branch -M main
   git push -u origin main
   ```

---

## 🛡️ Protecting Branches

Set branch protection rules on GitHub:
- Require pull request reviews before merging
- Require status checks to pass
- Require branches to be up to date before merging
- Dismiss stale pull request approvals
- Require signed commits

---

## 🔄 CI/CD Pipeline

Recommended GitHub Actions workflow (`.github/workflows/ci.yml`):

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint
      run: npm run lint
    
    - name: Build
      run: npm run build
```

---

## 📦 Releases

Create version tags:

```bash
# Create a tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag to remote
git push origin v1.0.0

# View all tags
git tag -l
```

---

## 🎯 Best Practices

✅ Commit often, push regularly
✅ Write descriptive commit messages
✅ Use meaningful branch names
✅ Keep branches focused on single features
✅ Create PRs for all changes
✅ Request reviews from teammates
✅ Keep main branch stable
✅ Tag releases

❌ Don't commit directly to main
❌ Don't use generic commit messages ("fix" or "update")
❌ Don't force push to shared branches
❌ Don't commit sensitive data (.env files)
❌ Don't leave long-lived branches unmerged

---

**Happy collaborating! 🚀**
