@echo off
cd /d "%~dp0"
echo Initializing git and pushing SN Cleaning Services website to GitHub...
echo.

git init
git config user.name "Silvia"
git config user.email "seo.silvi@gmail.com"
git add -A
git commit -m "Update SN Cleaning Services website"
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin https://github.com/betterresults/sncleaningwebsite.git

echo.
echo Pushing to GitHub (this replaces what's on GitHub with this folder's version)...
git push -u origin main --force

echo.
echo Done! If a browser window opened asking you to sign in to GitHub, complete that sign-in.
pause
