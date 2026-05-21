# Git Push Instructions

Git is not installed on this machine. Please follow these steps:

## Option 1: Install Git and push manually

1. **Install Git** from: https://git-scm.com/downloads/win

2. **Open a new terminal** (Command Prompt, PowerShell, or Git Bash) and navigate to the project:

   ```bash
   cd "C:\Users\tilottamw\Downloads\atd"
   ```

3. **Initialize Git and push:**

   ```bash
   git init
   git add .
   git commit -m "Initial commit - Ethos Academic Directory dashboard"
   git branch -M main
   git remote add origin https://github.com/tilottamwagh/Ethos-Academic-Directory.git
   git push -u origin main
   ```

## Option 2: Use VS Code's built-in Git

1. Open the project in VS Code
2. Press `Ctrl+Shift+G` to open Source Control
3. Click "Initialize Repository"
4. Stage all changes (click `+` on "Changes")
5. Write a commit message and press `Ctrl+Enter`
6. Click "Publish Branch" and paste the repository URL:
   `https://github.com/tilottamwagh/Ethos-Academic-Directory.git`

## Optional: Add a `.gitignore` file

If you want a `.gitignore` before pushing, create a file named `.gitignore` in the project root with:

```
node_modules/
dist/
.vite/
*.local