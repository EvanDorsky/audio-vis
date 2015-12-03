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

    var visualizer = function() {
        var vis = this

        vis.p = {}
        vis.p.canvas = document.createElement('canvas')
        vis.p.canvasCtx = vis.p.canvas.getContext('2d')

        vis.config = function(streamSource) {
            vis.analyser = audioCtx.createAnalyser()
            vis.analyser.fftSize = vis.p.fftSize
            vis.analyser.smoothingTimeConstant = vis.p.smoothingTimeConstant

            streamSource.connect(vis.analyser)

            vis.p.canvas.width = 800
            vis.p.canvas.height = 600

            document.body.appendChild(vis.p.canvas)

            vis.byteArray = new Uint8Array(vis.analyser.frequencyBinCount)

            vis.render()

            return vis
        }
        vis.render = function() {
            vis.analyser.getByteFrequencyData(vis.byteArray)
            requestAnimationFrame(vis.render)

            vis.draw()
        }

        // generate getters/setters
        Object.keys(vis.p).forEach(function(key) {
            vis[key] = function(_) {
                if (!arguments.length) return p[key]
                p[key] = _
                return vis
            }
        })

        return vis
    }

    var spectrum = function() {
        var vis = new visualizer()

        vis.p.fftSize = 64
        vis.p.smoothingTimeConstant = .7

        vis.draw = function() {
            vis.p.canvasCtx.fillStyle = 'black'
            vis.p.canvasCtx.fillRect(0, 0, vis.p.canvas.width, vis.p.canvas.height)

            var barwidth = vis.p.canvas.width/vis.byteArray.length
            for (var i = vis.byteArray.length - 1; i >= 0; i--) {
                var x = i*barwidth+1
                var y = vis.byteArray[i]/255.0
                vis.p.canvasCtx.fillStyle = colormapFromNorm(y, 0.3)
                vis.p.canvasCtx.fillRect(x, vis.p.canvas.height, barwidth-2, -y*vis.p.canvas.height)
            }
        }

        return vis
    }

    var centerspectrum = function() {
        var vis = new spectrum()

        vis.draw = function() {
            vis.p.canvasCtx.fillStyle = 'black'
            vis.p.canvasCtx.fillRect(0, 0, vis.p.canvas.width, vis.p.canvas.height)

            var barwidth = vis.p.canvas.width/vis.byteArray.length
            for (var i = vis.byteArray.length - 1; i >= 0; i--) {
                var x = i*barwidth+1
                var y = vis.byteArray[i]/255.0
                vis.p.canvasCtx.fillStyle = colormapFromNorm(y, 0.3)
                vis.p.canvasCtx.fillRect(x, (1-y)*vis.p.canvas.height/2, barwidth-2, y*vis.p.canvas.height)
            }
        }

        return vis
    }

    var spectrogram = function() {
        var vis = new visualizer()

        vis.p.fftSize = 2048
        vis.p.smoothingTimeConstant = 0
        vis.p.tempCanvas = document.createElement('canvas')
        vis.p.tempCtx = vis.p.tempCanvas.getContext('2d')

        vis.config = function(streamSource) {
            vis.analyser = audioCtx.createAnalyser()
            vis.analyser.fftSize = vis.p.fftSize
            vis.analyser.smoothingTimeConstant = vis.p.smoothingTimeConstant
            vis.analyser.minDecibels = -140

            streamSource.connect(vis.analyser)

            vis.p.canvas.width = 800
            vis.p.canvas.height = 600

            vis.p.tempCanvas.width = 800
            vis.p.tempCanvas.height = 600

            document.body.appendChild(vis.p.canvas)

            vis.byteArray = new Uint8Array(vis.analyser.frequencyBinCount)

            vis.render()

            return vis
        }
        vis.draw = function() {
            var dw = 2

            vis.p.canvasCtx.fillStyle = 'black'
            vis.p.canvasCtx.fillRect(0, 0, vis.p.canvas.width, vis.p.canvas.height)
            vis.p.canvasCtx.drawImage(vis.p.tempCanvas, 0, 0)
            var boxheight = vis.p.canvas.height/vis.byteArray.length
            for (var i = vis.byteArray.length - 1; i >= 0; i--) {
                var y = i*boxheight
                var norm = vis.byteArray[i]/255.0
                vis.p.canvasCtx.fillStyle = colormapFromNorm(norm)

                vis.p.canvasCtx.fillRect(vis.p.canvas.width-dw, vis.p.canvas.height-y, dw*2, boxheight+1)
            }

            vis.p.tempCtx.translate(-dw, 0)
            vis.p.tempCtx.drawImage(vis.p.canvas, 0, 0)
            vis.p.tempCtx.translate(dw, 0)
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