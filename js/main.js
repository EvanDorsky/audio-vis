window.onload = function() {    
    navigator.getUserMedia = (navigator.getUserMedia ||
                              navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia ||
                              navigator.msGetUserMedia)

    var ac = new (window.AudioContext || window.webkitAudioContext)()

    var analyze = function() {
        var freqs = new Uint8Array(this.frequencyBinCount)
        this.getByteFrequencyData(freqs) 
        var min = this.minDecibels
        var max = this.maxDecibels

        var norms = freqs.map(function(x) {
            return (-x-min)/(max-min)
        })

        window.analyserData = freqs
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
                analyser.fftSize = 512

                src.connect(analyser)
                analyser.connect(ac.destination)

                setInterval(analyze.bind(analyser), 50)
            },
            function(err) {
                console.error(err)
            }
        )
    }

    var canvas = document.getElementById('vis')
    var width = canvas.width
    var height = canvas.height
    var cc = canvas.getContext('2d')

    var draw = function(ctx) {
        var data = window.analyserData
        var drawVisual = requestAnimationFrame(draw.bind(null, ctx))

        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, width, height)

        ctx.lineWidth = 2
        ctx.strokeStyle = 'white'

        ctx.beginPath()

        ctx.moveTo(20*(data.length-1), data[data.length-1])
        for (var i = data.length - 2; i >= 0; i--) {
            var x = i*20

            var y = data[i]

            ctx.lineTo(x, y)
            ctx.stroke()
        }
    }

    draw(cc)
}