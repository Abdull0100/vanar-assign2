# 🌿 Git Branching Strategy

This document outlines the branching strategy for Assignment 2, ensuring proper source control hygiene and collaboration.

## 🎯 Branch Naming Convention

### Main Branches

- `main` - Production-ready code (protected)
- `develop` - Integration branch for features

### Feature Branches

```
feature/authentication
feature/admin-dashboard
feature/ai-chat
feature/oauth-integration
feature/email-verification
feature/password-reset
feature/user-profile
feature/database-schema
```

### Bug Fix Branches

```
fix/auth-error
fix/database-connection
fix/oauth-callback
fix/email-sending
```

### Hotfix Branches

```
hotfix/security-patch
hotfix/critical-bug
```

## 🚀 Workflow

### 1. Starting a New Feature

```bash
# Ensure you're on develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/feature-name

# Make your changes and commit
git add .
git commit -m "feat: add user authentication system"
```

### 2. Committing Changes

Use **Conventional Commits** format:

```bash
# Feature additions
git commit -m "feat: implement OAuth Google sign-in"

# Bug fixes
git commit -m "fix: resolve database connection timeout"

# Documentation
git commit -m "docs: update README with setup instructions"

# Refactoring
git commit -m "refactor: optimize database queries"

# Chores
git commit -m "chore: update dependencies"
```

### 3. Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, missing semicolons, etc.
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Build process, tooling changes

**Examples:**

```bash
git commit -m "feat(auth): add password reset functionality"
git commit -m "fix(oauth): resolve GitHub callback URL issue"
git commit -m "docs(readme): add troubleshooting section"
git commit -m "refactor(database): optimize user queries"
```

### 4. Pull Request Process

1. **Push your feature branch**

   ```bash
   git push origin feature/feature-name
   ```

2. **Create Pull Request**
   - Target: `develop` branch
   - Title: Use conventional commit format
   - Description: Explain what was implemented
   - Assign reviewers from your group

3. **Code Review**
   - At least one peer review required
   - Address all review comments
   - Ensure CI passes

4. **Merge to Develop**
   - Squash commits if needed
   - Delete feature branch after merge

### 5. Releasing to Main

```bash
# Merge develop to main
git checkout main
git pull origin main
git merge develop
git push origin main

# Tag the release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## 📋 Commit Quality Standards

### ✅ DO

- Make small, focused commits (5-15 changes max)
- Use descriptive commit messages
- Test before committing
- Ensure builds pass locally
- Follow conventional commit format

### ❌ DON'T

- Commit broken code
- Make large, unfocused commits
- Use vague commit messages
- Skip testing
- Commit directly to main/develop

## 🔄 Daily Workflow

### Morning

```bash
git checkout develop
git pull origin develop
```

### During Development

```bash
# Make changes
git add .
git commit -m "feat: implement feature X"

# Push frequently
git push origin feature/feature-name
```

### End of Day

```bash
# Ensure all changes are pushed
git push origin feature/feature-name

# Update your PR if needed
```

## 🚨 Emergency Procedures

### Hotfix Process

```bash
# Create hotfix from main
git checkout main
git checkout -b hotfix/critical-issue

# Fix the issue
git commit -m "fix: resolve critical security issue"

# Create PR to main
# After approval, merge to main AND develop
```

## 📊 Branch Protection Rules

### Main Branch

- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Restrict pushes to main

### Develop Branch

- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Allow force pushes (for cleanup)

## 🧹 Branch Cleanup

### After Merging

```bash
# Delete local feature branch
git branch -d feature/feature-name

# Delete remote feature branch
git push origin --delete feature/feature-name
```

### Regular Cleanup

```bash
# Remove merged branches
git remote prune origin

# Clean up local branches
git branch --merged | grep -v "\*" | xargs -n 1 git branch -d
```

## 📚 Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

**Remember**: Good branching strategy leads to better collaboration and code quality! 🌟
