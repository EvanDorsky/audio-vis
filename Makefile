all: index.html js/bundle.js stylesheets/style.css

index.html : jade/index.jade stylesheets/style.css
	jade jade/index.jade -o .

js/bundle.js : js/main.js
	browserify js/main.js > js/bundle.js

stylesheets/style.css : stylus/style.styl
	stylus stylus/style.styl -o stylesheets