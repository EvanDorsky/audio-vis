var d3_scale = require('d3-scale')

// http://oli.me.uk/2013/06/08/searching-javascript-arrays-with-a-binary-search/
function binaryIndexOf(seEl) {
    var minIndex = 0
    var maxIndex = this.length - 1
    var cInd
    var curEl
    
    while (minIndex <= maxIndex) {
        cInd = (minIndex + maxIndex) / 2 | 0
        curEl = this[cInd]

        if (curEl < seEl)
            minIndex = cInd + 1
        else if (curEl > seEl)
            maxIndex = cInd - 1
    }

    return cInd
}

Array.prototype.binaryIndexOf = binaryIndexOf

// just for display, tonal accuracy is "unimportant"
var musicMap = function() {
    var map = this
    var C1 = 32.7
    
    // 12 semitones 
    var factor = Math.pow(2, 1/12)
    var notes = []
    var noteFreqs = []

    // turns out this is accurate enough for graphics
    var note = C1
    var octave = [
        'C',
        'C#',
        'D',
        'D#',
        'E',
        'F',
        'F#',
        'G',
        'G#',
        'A',
        'A#',
        'B',
    ]
    for (var i = 0; i < 12*9; i++) {
        notes.push({
            name: octave[i%12]+(1+i/12 | 0),
            Hz: note
        })
        noteFreqs.push(note)
        note *= factor
    }
    map.note = function(name) {
        return notes.find(function(n) {
            return n.name === name
        })
    }
    map.nearest = function(freq) {
        return notes[noteFreqs.binaryIndexOf(freq)]
    }
    map.notes = notes

    return map
}

var mMap = new musicMap()
var As = mMap.notes.filter(function(x) {
    return /A\d/.test(x.name)
})

var strings = []
strings.push(mMap.note('C3'))
strings.push(mMap.note('G3'))
strings.push(mMap.note('D4'))
strings.push(mMap.note('A4'))

function keyEvent(e) {
    if (e.keyCode === 32) // spacebar
        window.activeVis.roll(!window.activeVis.rolling)

    if (e.keyCode === 108) // L key
        window.activeVis.setLines()
}

function mouseDown(e) {
    window.activeVis.cursor.down = true

    if (!window.activeVis.rolling)
        window.activeVis.render()
}

function mouseMove(e) {
    window.activeVis.cursor.x = e.x
    window.activeVis.cursor.y = e.y

    if (!window.activeVis.rolling)
        window.activeVis.render()
}

function mouseUp(e) {
    window.activeVis.cursor.down = false

    if (!window.activeVis.rolling)
        window.activeVis.render()
}

window.addEventListener('keypress', keyEvent, false)
window.addEventListener('mousedown', mouseDown, false)
window.addEventListener('mousemove', mouseMove, false)
window.addEventListener('mouseup', mouseUp, false)

window.onload = function() {
    navigator.getUserMedia = (navigator.getUserMedia ||
                              navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia ||
                              navigator.msGetUserMedia)

    var audioCtx = new (window.AudioContext || window.webkitAudioContext)()

    // var jet = colormap({
    //     colormap: 'electric',
    //     nshades: 2048,
    //     format: 'hex',
    // })

    // var colormapFromNorm = function(norm, offset) {
    //     offset = offset || 0
    //     return jet[Math.floor((offset + norm*(1-offset))*jet.length - 1)]
    // }

    var visualizer = function() {
        var vis = this

        vis = {}
        vis.canvas = document.createElement('canvas')
        vis.canvasCtx = vis.canvas.getContext('2d')

        vis.cursor = {}
        vis.rolling = true

        vis.config = function(streamSource) {
            vis.analyser = audioCtx.createAnalyser()
            vis.analyser.fftSize = vis.fftSize
            vis.analyser.smoothingTimeConstant = vis.smoothingTimeConstant

            streamSource.connect(vis.analyser)

            vis.canvas.width = 1440
            vis.canvas.height = 800

            document.body.appendChild(vis.canvas)

            vis.byteArray = new Uint8Array(vis.analyser.frequencyBinCount)

            vis.roll(true)

            return vis
        }
        vis.roll = function(rolling) {
            vis.rolling = rolling

            if (rolling) vis.render()
        }
        vis.render = function() {
            vis.analyser.getByteFrequencyData(vis.byteArray)

            if (vis.rolling) requestAnimationFrame(vis.render)

            vis.draw()
        }

        return vis
    }

    var scope = function() {
        var vis = this

        vis = {}
        vis.canvas = document.createElement('canvas')
        vis.canvasCtx = vis.canvas.getContext('2d')

        vis.rolling = true

        vis.config = function(streamSource) {
            vis.analyser = audioCtx.createAnalyser()
            vis.analyser.minDecibels = -140
            vis.analyser.maxDecibels = 0
            vis.analyser.fftSize = 1024

            streamSource.connect(vis.analyser)

            vis.canvas.width = 1440
            vis.canvas.height = 800

            document.body.appendChild(vis.canvas)

            vis.byteArray = new Uint8Array(vis.analyser.frequencyBinCount)

            vis.roll(true)

            return vis
        }
        vis.roll = function(rolling) {
            vis.rolling = rolling

            if (rolling) vis.render()
        }
        vis.render = function() {
            vis.analyser.getByteTimeDomainData(vis.byteArray)

            if (vis.rolling) requestAnimationFrame(vis.render)

            vis.draw()
        }
        vis.draw = function() {
            vis.canvasCtx.fillStyle = 'black'
            vis.canvasCtx.fillRect(0, 0, vis.canvas.width, vis.canvas.height)

            var barwidth = vis.canvas.width/vis.byteArray.length
            for (var i = vis.byteArray.length - 1; i >= 0; i--) {
                var x = i*barwidth+1
                var y = vis.byteArray[i]/255.0
                vis.canvasCtx.fillStyle = 'white'
                vis.canvasCtx.fillRect(x, vis.canvas.height, barwidth+.75, -y*vis.canvas.height)
            }
        }

        return vis
    }

    var spectrum = function() {
        var vis = new visualizer()

        vis.fftSize = 256
        vis.smoothingTimeConstant = .7

        vis.draw = function() {
            vis.canvasCtx.fillStyle = 'black'
            vis.canvasCtx.fillRect(0, 0, vis.canvas.width, vis.canvas.height)

            var barwidth = vis.canvas.width/vis.byteArray.length
            for (var i = vis.byteArray.length - 1; i >= 0; i--) {
                var x = i*barwidth+1
                var y = vis.byteArray[i]/25.0
                vis.canvasCtx.fillStyle = colormapFromNorm(y, 0.3)
                vis.canvasCtx.fillRect(x, vis.canvas.height, barwidth-2, -y*vis.canvas.height)
            }
        }

        return vis
    }

    var centerspectrum = function() {
        var vis = new spectrum()

        vis.draw = function() {
            vis.canvasCtx.fillStyle = 'black'
            vis.canvasCtx.fillRect(0, 0, vis.canvas.width, vis.canvas.height)

            var barwidth = vis.canvas.width/vis.byteArray.length
            for (var i = vis.byteArray.length - 1; i >= 0; i--) {
                var x = i*barwidth+1
                var y = vis.byteArray[i]/255.0
                vis.canvasCtx.fillStyle = colormapFromNorm(y, 0.3)
                vis.canvasCtx.fillRect(x, (1-y)*vis.canvas.height/2, barwidth-2, y*vis.canvas.height)
            }
        }

        return vis
    }

    var spectrogram = function() {
        var vis = new visualizer()

        vis.fftSize = 2048
        vis.smoothingTimeConstant = 0
        vis.tempCanvas = document.createElement('canvas')
        vis.tempCtx = vis.tempCanvas.getContext('2d')

        vis.logScale = true
        vis.lines = 0

        vis.config = function(streamSource) {
            vis.analyser = audioCtx.createAnalyser()
            vis.analyser.fftSize = vis.fftSize
            
            vis.analyser.smoothingTimeConstant = vis.smoothingTimeConstant

            streamSource.connect(vis.analyser)

            vis.canvas.width = 400
            vis.canvas.height = 400

            vis.margin = 20

            vis.gwidth = vis.canvas.width-vis.margin*2
            vis.gheight = vis.canvas.height-vis.margin*2

            vis.tempCanvas.width = vis.gwidth
            vis.tempCanvas.height = vis.gheight

            if (vis.logScale)
                vis.ypixscale = d3_scale.log(2)
                    .domain([1, vis.fftSize/2-1])
                    .range([vis.gheight+vis.margin, vis.margin])
            else
                vis.ypixscale = d3_scale.linear()
                    .domain([1, vis.fftSize/2-1])
                    .range([vis.gheight+vis.margin, vis.margin])

            vis.freqscale = d3_scale.linear()
                    .domain([1, vis.fftSize/2-1])
                    .range([1, audioCtx.sampleRate/2])

            vis.colorscale = d3_scale.inferno()
                .domain([0, 255])

            vis.freq0 = mMap.note('A2').Hz

            document.body.appendChild(vis.canvas)

            vis.byteArray = new Uint8Array(vis.analyser.frequencyBinCount)

            vis.roll(true)

            return vis
        }
        vis.setLines = function() {
            vis.lines = (vis.lines+1)%3

            if (!vis.rolling) vis.render()
        }
        vis.draw = function() {
            var dw = 3

            vis.canvasCtx.fillStyle = 'gray'

            vis.canvasCtx.fillRect(0, 0, vis.canvas.width, vis.canvas.height)
            vis.canvasCtx.drawImage(vis.tempCanvas, 0, 0, vis.gwidth, vis.gheight, vis.margin, vis.margin, vis.gwidth, vis.gheight)

            var y = 0
            for (var i = 0; i < vis.byteArray.length; i++) {
                y = vis.ypixscale(i)
                vis.canvasCtx.fillStyle = vis.colorscale(vis.byteArray[i])

                vis.canvasCtx.fillRect(vis.margin+vis.gwidth-dw, y,
                    dw, vis.ypixscale(i+1)-y-1)
            }

            if (vis.rolling) {
                vis.tempCtx.translate(-dw, 0)
                vis.tempCtx.drawImage(vis.canvas, vis.margin, vis.margin, vis.gwidth, vis.gheight, 0, 0, vis.gwidth, vis.gheight)
                vis.tempCtx.translate(dw, 0)
            }

            vis.canvasCtx.font = '100 10px Open Sans'
            vis.canvasCtx.textAlign = 'right'
            vis.canvasCtx.textBaseline = 'middle'
            vis.canvasCtx.strokeStyle = 'white'

            var yticks = vis.ypixscale.ticks()
            for (var i in yticks) {
                var tick = vis.ypixscale(yticks[i])

                vis.canvasCtx.fillStyle = 'white'
                vis.canvasCtx.beginPath()
                vis.canvasCtx.moveTo(vis.gwidth+vis.margin, tick)
                vis.canvasCtx.lineTo(vis.gwidth+2*vis.margin, tick)
                vis.canvasCtx.stroke()
                vis.canvasCtx.fillText(vis.freqscale(yticks[i])|0, vis.gwidth+2*vis.margin, tick)
                // var note = As[j]
                //     vis.canvas.width-dw,
                //     (vis.canvas.height-vis.yFromFreq(note.Hz))*sfactor)
                // vis.canvasCtx.fillRect(vis.canvas.width-rightPadding,
                //     (vis.canvas.height-vis.yFromFreq(note.Hz))*sfactor,
                //     rightPadding-30, 1)

                if (vis.lines > 0) {
                    vis.canvasCtx.strokeStyle = 'rgba(255,255,255,0.5)'
                    vis.canvasCtx.beginPath()
                    vis.canvasCtx.moveTo(vis.margin, tick)
                    vis.canvasCtx.lineTo(vis.gwidth+vis.margin, tick)
                    vis.canvasCtx.stroke()
                }
            }

            vis.canvasCtx.textAlign = 'center'
            vis.canvasCtx.textBaseline = 'bottom'
            vis.canvasCtx.fillStyle = 'white'

            // // ticks every half second, 60Hz refresh rate
            var tickSpacing = 30*dw
            var tickX = vis.gwidth+vis.margin
            var time = 0
            while (tickX > 0) {
                vis.canvasCtx.strokeStyle = 'white'
                vis.canvasCtx.fillText(time, tickX, vis.canvas.height)
                vis.canvasCtx.beginPath()
                vis.canvasCtx.moveTo(tickX, vis.gheight)
                vis.canvasCtx.lineTo(tickX, vis.gheight+vis.margin)
                vis.canvasCtx.stroke()

                if (vis.lines === 2) {
                    vis.canvasCtx.strokeStyle = 'rgba(255,255,255,0.5)'
                    vis.canvasCtx.beginPath()
                    vis.canvasCtx.moveTo(tickX, vis.margin)
                    vis.canvasCtx.lineTo(tickX, vis.gheight+vis.margin)
                    vis.canvasCtx.stroke()
                }

                tickX -= tickSpacing
                time += 0.5
            }

            // vis.canvasCtx.fillStyle = 'white'
            // // draw cursor
            // if (vis.cursor.down) {
            //     vis.canvasCtx.fillRect(0, vis.cursor.y, specWidth, 1)
            //     vis.canvasCtx.fillRect(vis.cursor.x, 0, -1, specHeight)

            //     var yFromY = (vis.canvas.height - vis.cursor.y/sfactor)

            //     // draw nearest Y label
            //     var nearest = mMap.nearest(vis.freqFromY(yFromY))
            //     var nearY = vis.yFromFreq(nearest.Hz)

            //     if (nearest) {
            //         vis.canvasCtx.fillStyle = 'white'
            //         vis.canvasCtx.textAlign = 'right'
            //         vis.canvasCtx.textBaseline = 'middle'

            //         vis.canvasCtx.fillText(nearest.name,
            //             vis.canvas.width-dw,
            //             (vis.canvas.height-nearY)*sfactor)
            //         vis.canvasCtx.fillRect(vis.canvas.width-rightPadding,
            //             (vis.canvas.height-nearY)*sfactor,
            //             rightPadding-40, 1)
            //     }
            // }
        }

        return vis
    }

    if (navigator.getUserMedia) {
        navigator.getUserMedia(
            { audio: true },
            function(stream) {
                var streamSource = audioCtx.createMediaStreamSource(stream)

                window.activeVis = new spectrogram()
                window.activeVis.config(streamSource)

                // window.activeVis = new spectrum()
                // window.activeVis.config(streamSource)

                // window.activeVis = new scope()
                // window.activeVis.config(streamSource)
            },
            function(err) {
                console.error(err)
            }
        )
    }
}