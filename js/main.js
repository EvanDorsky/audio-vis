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
                analyser.fftSize = 256

                src.connect(analyser)

                drawspectrum(cc, analyser)
            },
            function(err) {
                console.error(err)
            }
        )
    }

    var drawspectrum = function(ctx, analyser) {
        var data = analyze(analyser)
        requestAnimationFrame(drawspectrum.bind(null, ctx, analyser))

        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, width, height)

        ctx.fillStyle = 'white'

        for (var i = data.length - 1; i >= 0; i--) {
            var barwidth = width/data.length
            var x = i*barwidth+1
            var y = data[i]

            ctx.fillRect(x, height, barwidth-2, -y)
        }
    }
}