all: index.html js/bundle.js stylesheets/style.css js/fft.js

index.html: jade/index.jade
	jade jade/index.jade -o .

js/bundle.js: js/main.js
	browserify js/main.js > js/bundle.js

stylesheets/style.css: stylus/style.styl
	stylus stylus/style.styl -o stylesheets

js/fft.js: c
	emcc c/fft.c -o js/fft.js -s EXPORTED_FUNCTIONS="['_setN', '_dft', '_fft']"

c: c/fft.c
	gcc c/fft.c -o js/fft.o

make runc: c
	./js/fft.o