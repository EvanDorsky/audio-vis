all: index.html js/bundle.js stylesheets/style.css js/fft.js

index.html: jade/index.jade
	jade jade/index.jade -o .

js/bundle.js: js/main.js js/fft.js
	browserify -t strictify js/main.js > js/bundle.js

stylesheets/style.css: stylus/style.styl
	stylus stylus/style.styl -o stylesheets

js/fft.js: js/fft.c
	emcc js/fft.c -o js/fft.js -s EXPORTED_FUNCTIONS="['_cdft']"