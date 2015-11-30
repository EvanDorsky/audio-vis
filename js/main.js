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

            this.byteArray = new Uint8Array(this.analyser.frequencyBinCount)

            this.draw()
        },
        draw: function() {
            this.analyser.getByteFrequencyData(this.byteArray)

            requestAnimationFrame(this.draw.bind(this))

            this.canvasCtx.fillStyle = 'black'
            this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height)

            var barwidth = this.canvas.width/this.byteArray.length
            for (var i = this.byteArray.length - 1; i >= 0; i--) {
                var x = i*barwidth+1
                var y = this.byteArray[i]/255.0
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

            this.byteArray = new Uint8Array(this.analyser.frequencyBinCount)

            this.draw()
        },
        draw: function() {
            this.analyser.getByteFrequencyData(this.byteArray)
            requestAnimationFrame(this.draw.bind(this))

            var dw = 2

            this.canvasCtx.fillStyle = 'black'
            this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height)
            this.canvasCtx.drawImage(this.tempCanvas, 0, 0)
            var boxheight = this.canvas.height/this.byteArray.length
            for (var i = this.byteArray.length - 1; i >= 0; i--) {
                var y = i*boxheight
                var norm = this.byteArray[i]/255.0
                this.canvasCtx.fillStyle = colormapFromNorm(norm)

                this.canvasCtx.fillRect(this.canvas.width-dw, this.canvas.height-y, dw*2, boxheight+1)
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