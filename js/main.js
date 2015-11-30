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
        config: function(analyser) {
            this.analyser = analyser

            this.canvas.width = 800
            this.canvas.height = 600

            this.canvasCtx = this.canvas.getContext('2d')
        },
        draw: function() {
            var data = analyze(this.analyser)
            requestAnimationFrame(this.draw.bind(this))

            this.canvasCtx.fillStyle = 'black'
            this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height)

            for (var i = data.length - 1; i >= 0; i--) {
                var barwidth = this.canvas.width/data.length
                var x = i*barwidth+1
                var y = data[i]
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
        config: function(analyser) {
            this.analyser = analyser

            this.canvas.width = 800
            this.canvas.height = 600
            this.canvasCtx = this.canvas.getContext('2d')

            this.tempCanvas.width = 800
            this.tempCanvas.height = 600
            this.tempCtx = this.tempCanvas.getContext('2d')
        },
        draw: function() {
            var width = this.canvas.width
            var height = this.canvas.height

            var data = analyze(this.analyser)
            requestAnimationFrame(this.draw.bind(this))

            var dw = 2

            this.canvasCtx.fillStyle = 'black'
            this.canvasCtx.fillRect(0, 0, width, height)
            this.canvasCtx.drawImage(this.tempCanvas, 0, 0)
            for (var i = data.length - 1; i >= 0; i--) {
                var boxheight = height/data.length
                var y = i*boxheight
                var db = data[i]
                this.canvasCtx.fillStyle = "rgb("+db+","+db+","+db+")"

                this.canvasCtx.fillRect(width-dw, height-y, dw*2, boxheight+1)
            }

            this.tempCtx.translate(-dw, 0)
            this.tempCtx.drawImage(this.canvas, 0, 0)
            this.tempCtx.translate(dw, 0)
        }
    }

    var analyze = function(analyser) {
        var freqs = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(freqs)

        return freqs
    }

    if (navigator.getUserMedia) {
        navigator.getUserMedia
        (
            {   
                audio: true
            },
            function(stream) {
                var streamSource = audioCtx.createMediaStreamSource(stream)

                configVis(streamSource, spectrogram)
            },
            function(err) {
                console.error(err)
            }
        )
    }

    var configVis = function(streamSource, vis) {
        var analyser = audioCtx.createAnalyser()
        analyser.fftSize = vis.fftSize
        analyser.smoothingTimeConstant = vis.smoothingTimeConstant

        streamSource.connect(analyser)

        vis.config(analyser)
        vis.draw()
    }
}