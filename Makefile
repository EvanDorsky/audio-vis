index.html : jade/index.jade stylesheets/style.css
	jade jade/index.jade -o .

stylesheets/style.css : stylus/style.styl
	stylus stylus/style.styl -o stylesheets