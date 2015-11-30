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

    var spectrum = {
        analyser: null,
        fftSize: 64,
        smoothingTimeConstant: .7,
        canvas: document.createElement('canvas'),
        config: function(streamSource) {
            this.analyser = audioCtx.createAnalyser()
            this.analyser.fftSize = this.fftSize
            this.analyser.smoothingTimeConstant = this.smoothingTimeConstant

            streamSource.connect(this.analyser)

            this.canvas.width = 800
            this.canvas.height = 600
            this.canvasCtx = this.canvas.getContext('2d')

            document.body.appendChild(this.canvas)

            this.draw()
        },
        draw: function() {
            var freqBytes = new Uint8Array(this.analyser.frequencyBinCount)
            this.analyser.getByteFrequencyData(freqBytes)

            requestAnimationFrame(this.draw.bind(this))

            this.canvasCtx.fillStyle = 'black'
            this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height)

            this.canvasCtx.font = "16px Helvetica"

            var barwidth = this.canvas.width/freqBytes.length
            for (var i = freqBytes.length - 1; i >= 0; i--) {
                var x = i*barwidth+1
                var y = freqBytes[i]/255.0
                this.canvasCtx.fillStyle = colormapFromNorm(y, 0.3)
                this.canvasCtx.fillRect(x, this.canvas.height, barwidth-2, -y*this.canvas.height)
            }
        }
    }

    var spectrogram = {
        analyser: null,
        fftSize: 2048,
        smoothingTimeConstant: 0,
        canvas: document.createElement('canvas'),
        tempCanvas: document.createElement('canvas'),
        config: function(streamSource) {
            this.analyser = audioCtx.createAnalyser()
            this.analyser.fftSize = this.fftSize
            this.analyser.smoothingTimeConstant = this.smoothingTimeConstant
            this.minDecibels = -140

            streamSource.connect(this.analyser)

            this.canvas.width = 800
            this.canvas.height = 600
            this.canvasCtx = this.canvas.getContext('2d')

            this.tempCanvas.width = 800
            this.tempCanvas.height = 600
            this.tempCtx = this.tempCanvas.getContext('2d')

            document.body.appendChild(this.canvas)

            this.draw()
        },
        draw: function() {
            var width = this.canvas.width
            var height = this.canvas.height

            var freqBytes = new Uint8Array(this.analyser.frequencyBinCount)
            this.analyser.getByteFrequencyData(freqBytes)
            requestAnimationFrame(this.draw.bind(this))

            var dw = 2

            this.canvasCtx.fillStyle = 'black'
            this.canvasCtx.fillRect(0, 0, width, height)
            this.canvasCtx.drawImage(this.tempCanvas, 0, 0)
            var boxheight = height/freqBytes.length
            for (var i = freqBytes.length - 1; i >= 0; i--) {
                var y = i*boxheight
                var norm = freqBytes[i]/255.0
                this.canvasCtx.fillStyle = colormapFromNorm(norm)

                this.canvasCtx.fillRect(width-dw, height-y, dw*2, boxheight+1)
            }

            this.tempCtx.translate(-dw, 0)
            this.tempCtx.drawImage(this.canvas, 0, 0)
            this.tempCtx.translate(dw, 0)
        }
    }

    if (navigator.getUserMedia) {
        navigator.getUserMedia(
            { audio: true },
            function(stream) {
                var streamSource = audioCtx.createMediaStreamSource(stream)

                spectrum.config(streamSource)
                spectrogram.config(streamSource)
            },
            function(err) {
                console.error(err)
            }
        )
    }
}