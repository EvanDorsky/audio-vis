window.onload = function() {    
    navigator.getUserMedia = (navigator.getUserMedia ||
                              navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia ||
                              navigator.msGetUserMedia)

    var ac = new (window.AudioContext || window.webkitAudioContext)()

    var canvas = document.getElementById('vis')
    var width = canvas.width
    var height = canvas.height
    var cc = canvas.getContext('2d')

    var analyze = function(analyser) {
        var freqs = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(freqs)
        analyser.smoothingTimeConstant = 0.7

        return freqs
    }

    if (navigator.getUserMedia) {
        navigator.getUserMedia
        (
            {   
                audio: true
            },
            function(stream) {
                var src = ac.createMediaStreamSource(stream)
                var analyser = ac.createAnalyser()
                analyser.fftSize = 64

                src.connect(analyser)

                var tempCanvas = document.createElement('canvas')
                tempCanvas.width = width
                tempCanvas.height = height
                var tempCtx = tempCanvas.getContext('2d')

                var draw = drawspectrum.bind({
                    tempCanvas: tempCanvas,
                    tempCtx: tempCtx
                })
                draw(cc, analyser)
            },
            function(err) {
                console.error(err)
            }
        )
    }

    var drawspectrum = function(ctx, analyser) {
        var data = analyze(analyser)
        requestAnimationFrame(drawspectrum.bind(this, ctx, analyser))

        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, width, height)

        for (var i = data.length - 1; i >= 0; i--) {
            var barwidth = width/data.length
            var x = i*barwidth+1
            var y = data[i]
            ctx.fillStyle = "rgb("+(y+20)+","+(y+20)+","+(y+20)+")"

            ctx.fillRect(x, height, barwidth-2, -y)
        }
    }

    var drawspectro = function(ctx, analyser) {
        var data = analyze(analyser)
        requestAnimationFrame(drawspectro.bind(this, ctx, analyser))

        var dw = 2

        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(this.tempCanvas, 0, 0)
        for (var i = data.length - 1; i >= 0; i--) {
            var boxheight = height/data.length
            var y = i*boxheight
            var db = data[i]
            ctx.fillStyle = "rgb("+db+","+db+","+db+")"

            ctx.fillRect(width-dw, height-y, dw*2, boxheight+1)
        }

        this.tempCtx.translate(-dw, 0)
        this.tempCtx.drawImage(canvas, 0, 0)
        this.tempCtx.translate(dw, 0)
    }
}