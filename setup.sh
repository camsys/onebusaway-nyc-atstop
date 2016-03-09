ionic start atstop blank
cd atstop
ionic setup sass
git init
git remote add origin https://github.com/camsys/onebusaway-nyc-atstop.git
git fetch --all
git reset --hard origin/master
rm www/img/ionic.png www/css/style.css .

mv js/config.tmpl.js js/config.js
npm install
bower install
gulp sass
gulp compress
