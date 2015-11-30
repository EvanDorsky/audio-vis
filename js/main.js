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
        var min = analyser.minDecibels
        var max = analyser.maxDecibels

        // var norms = freqs.map(function(d) {
        //     var x = d
        //     return ((-x-min)/(max-min)).toPrecision(4)
        // })

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
                analyser.smoothingTimeConstant = .3

                src.connect(analyser)

                draw(cc, analyser)
            },
            function(err) {
                console.error(err)
            }
        )
    }

    var draw = function(ctx, analyser) {
        var data = analyze(analyser)
        var drawVisual = requestAnimationFrame(draw.bind(null, ctx, analyser))
        console.log('analyser.maxDecibels');
        console.log(analyser.maxDecibels);
        console.log('analyser.minDecibels');
        console.log(analyser.minDecibels);

        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, width, height)

        ctx.fillStyle = 'white'

        for (var i = data.length - 1; i >= 0; i--) {
            var barwidth = width/data.length
            var x = i*barwidth
            var y = data[i]

            ctx.fillRect(x, height, barwidth-2, -y)
        }
    }
}