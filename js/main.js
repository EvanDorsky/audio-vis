var colormap = require('colormap')

window.onload = function() {    
    navigator.getUserMedia = (navigator.getUserMedia ||
                              navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia ||
                              navigator.msGetUserMedia)

    var audioCtx = new (window.AudioContext || window.webkitAudioContext)()

    var jet = colormap({
        colormap: 'electric',
        nshades: 1024,
        format: 'hex',
    })

    var colormapFromNorm = function(norm, offset) {
        offset = offset || 0
        return jet[Math.floor((offset + norm*(1-offset))*jet.length - 1)]
    }

    var spectrum = function() {
        var vis = this

        var fftSize = 64
        var smoothingTimeConstant = .7

        var canvas = document.createElement('canvas')
        var canvasCtx = canvas.getContext('2d')

        vis.config = function(streamSource) {
            vis.analyser = audioCtx.createAnalyser()
            vis.analyser.fftSize = fftSize
            vis.analyser.smoothingTimeConstant = smoothingTimeConstant

            streamSource.connect(vis.analyser)

            canvas.width = 800
            canvas.height = 600

            document.body.appendChild(canvas)

            vis.byteArray = new Uint8Array(vis.analyser.frequencyBinCount)

            vis.draw()
        }
        vis.draw = function() {
            vis.analyser.getByteFrequencyData(vis.byteArray)
            requestAnimationFrame(vis.draw)

            canvasCtx.fillStyle = 'black'
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height)

            var barwidth = canvas.width/vis.byteArray.length
            for (var i = vis.byteArray.length - 1; i >= 0; i--) {
                var x = i*barwidth+1
                var y = vis.byteArray[i]/255.0
                canvasCtx.fillStyle = colormapFromNorm(y, 0.3)
                canvasCtx.fillRect(x, canvas.height, barwidth-2, -y*canvas.height)
            }
        }

        return vis
    }

    var centerspectrum = function() {
        var vis = this

        var fftSize = 64
        var smoothingTimeConstant = .7

        var canvas = document.createElement('canvas')
        var canvasCtx = canvas.getContext('2d')

        vis.config = function(streamSource) {
            vis.analyser = audioCtx.createAnalyser()
            vis.analyser.fftSize = fftSize
            vis.analyser.smoothingTimeConstant = smoothingTimeConstant

            streamSource.connect(vis.analyser)

            canvas.width = 800
            canvas.height = 600

            document.body.appendChild(canvas)

            vis.byteArray = new Uint8Array(vis.analyser.frequencyBinCount)

            vis.draw()
        }
        vis.draw = function() {
            vis.analyser.getByteFrequencyData(vis.byteArray)
            requestAnimationFrame(vis.draw)

            canvasCtx.fillStyle = 'black'
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height)

            var barwidth = canvas.width/vis.byteArray.length
            for (var i = vis.byteArray.length - 1; i >= 0; i--) {
                var x = i*barwidth+1
                var y = vis.byteArray[i]/255.0
                canvasCtx.fillStyle = colormapFromNorm(y, 0.3)
                canvasCtx.fillRect(x, (1-y)*canvas.height/2, barwidth-2, y*canvas.height)
            }
        }

        return vis
    }

    var spectrogram = function() {
        var vis = this

        var fftSize = 2048
        var smoothingTimeConstant = 0
        var canvas = document.createElement('canvas')
        var canvasCtx = canvas.getContext('2d')
        var tempCanvas = document.createElement('canvas')
        var tempCtx = tempCanvas.getContext('2d')

        vis.config = function(streamSource) {
            vis.analyser = audioCtx.createAnalyser()
            vis.analyser.fftSize = fftSize
            vis.analyser.smoothingTimeConstant = smoothingTimeConstant
            vis.analyser.minDecibels = -140

            streamSource.connect(vis.analyser)

            canvas.width = 800
            canvas.height = 600

            tempCanvas.width = 800
            tempCanvas.height = 600

            document.body.appendChild(canvas)

            vis.byteArray = new Uint8Array(vis.analyser.frequencyBinCount)

            vis.draw()
        }
        vis.draw = function() {
            vis.analyser.getByteFrequencyData(vis.byteArray)
            requestAnimationFrame(vis.draw)

            var dw = 2

            canvasCtx.fillStyle = 'black'
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height)
            canvasCtx.drawImage(tempCanvas, 0, 0)
            var boxheight = canvas.height/vis.byteArray.length
            for (var i = vis.byteArray.length - 1; i >= 0; i--) {
                var y = i*boxheight
                var norm = vis.byteArray[i]/255.0
                canvasCtx.fillStyle = colormapFromNorm(norm)

                canvasCtx.fillRect(canvas.width-dw, canvas.height-y, dw*2, boxheight+1)
            }

            tempCtx.translate(-dw, 0)
            tempCtx.drawImage(canvas, 0, 0)
            tempCtx.translate(dw, 0)
        }

        return vis
    }

    if (navigator.getUserMedia) {
        navigator.getUserMedia(
            { audio: true },
            function(stream) {
                var streamSource = audioCtx.createMediaStreamSource(stream)

                var spec = new centerspectrum()
                spec.config(streamSource)

                var tro = new spectrogram()
                tro.config(streamSource)
            },
            function(err) {
                console.error(err)
            }
        )
    }
}