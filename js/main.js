window.onload = function() {    
    navigator.getUserMedia = (navigator.getUserMedia ||
                              navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia ||
                              navigator.msGetUserMedia)

    var audioCtx = new (window.AudioContext || window.webkitAudioContext)()

    var spectrum = {
        analyser: null,
        fftSize: 64,
        smoothingTimeConstant: .7,
        canvas: document.getElementById('vis'),
        config: function(streamSource) {
            this.analyser = audioCtx.createAnalyser()
            this.analyser.fftSize = this.fftSize
            this.analyser.smoothingTimeConstant = this.smoothingTimeConstant

            streamSource.connect(this.analyser)

            this.canvas.width = 800
            this.canvas.height = 600
            this.canvasCtx = this.canvas.getContext('2d')

            this.draw()
        },
        draw: function() {
            var freqs = new Uint8Array(this.analyser.frequencyBinCount)
            this.analyser.getByteFrequencyData(freqs)

            requestAnimationFrame(this.draw.bind(this))

            this.canvasCtx.fillStyle = 'black'
            this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height)

            for (var i = freqs.length - 1; i >= 0; i--) {
                var barwidth = this.canvas.width/freqs.length
                var x = i*barwidth+1
                var y = freqs[i]
                this.canvasCtx.fillStyle = "rgb("+(y+20)+","+(y+20)+","+(y+20)+")"

                this.canvasCtx.fillRect(x, this.canvas.height, barwidth-2, -y)
            }
        }
    }

    var spectrogram = {
        analyser: null,
        fftSize: 2048,
        smoothingTimeConstant: 0,
        canvas: document.getElementById('vis'),
        tempCanvas: document.createElement('canvas'),
        config: function(streamSource) {
            this.analyser = audioCtx.createAnalyser()
            this.analyser.fftSize = this.fftSize
            this.analyser.smoothingTimeConstant = this.smoothingTimeConstant

            streamSource.connect(this.analyser)

            this.canvas.width = 800
            this.canvas.height = 600
            this.canvasCtx = this.canvas.getContext('2d')

            this.tempCanvas.width = 800
            this.tempCanvas.height = 600
            this.tempCtx = this.tempCanvas.getContext('2d')

            this.draw()
        },
        draw: function() {
            var width = this.canvas.width
            var height = this.canvas.height

            var freqs = new Uint8Array(this.analyser.frequencyBinCount)
            this.analyser.getByteFrequencyData(freqs)
            requestAnimationFrame(this.draw.bind(this))

            var dw = 2

            this.canvasCtx.fillStyle = 'black'
            this.canvasCtx.fillRect(0, 0, width, height)
            this.canvasCtx.drawImage(this.tempCanvas, 0, 0)
            for (var i = freqs.length - 1; i >= 0; i--) {
                var boxheight = height/freqs.length
                var y = i*boxheight
                var db = freqs[i]
                this.canvasCtx.fillStyle = "rgb("+db+","+db+","+db+")"

                this.canvasCtx.fillRect(width-dw, height-y, dw*2, boxheight+1)
            }

            this.tempCtx.translate(-dw, 0)
            this.tempCtx.drawImage(this.canvas, 0, 0)
            this.tempCtx.translate(dw, 0)
        }
    }

    if (navigator.getUserMedia) {
        navigator.getUserMedia
        (
            {   
                audio: true
            },
            function(stream) {
                var streamSource = audioCtx.createMediaStreamSource(stream)

                spectrum.config(streamSource)
            },
            function(err) {
                console.error(err)
            }
        )
    }
}