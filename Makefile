all: index.html js/bundle.js stylesheets/style.css js/fft.js

index.html: jade/index.jade
	jade jade/index.jade -o .

js/bundle.js: js/main.js
	browserify js/main.js > js/bundle.js

stylesheets/style.css: stylus/style.styl
	stylus stylus/style.styl -o stylesheets

js/fft.js: c/fft.c c/test.c
	emcc c/fft.c c/test.c -o js/fft.js -s EXPORTED_FUNCTIONS="['_setN', '_dft', '_fft']"

native: c/fft.c c/test.c
	gcc c/fft.c c/test.c -o c/test.o

runc: native
	./c/test.o