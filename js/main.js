var colormap = require('colormap')

// http://oli.me.uk/2013/06/08/searching-javascript-arrays-with-a-binary-search/
function binaryIndexOf(seEl) {
    var minIndex = 0
    var maxIndex = this.length - 1
    var cInd
    var curEl
    var runningDiff = 10000
    var diff = 0
    
    while (minIndex <= maxIndex) {
        cInd = (minIndex + maxIndex) / 2 | 0
        curEl = this[cInd]

        if (curEl < seEl) {
            minIndex = cInd + 1
        }
        else if (curEl > seEl) {
            maxIndex = cInd - 1
        }
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
        window.tro.roll(!window.tro.rolling)

    if (e.keyCode === 108) // L key
        window.tro.setLines()
}

function mouseDown(e) {
    window.tro.cursor.down = true

    if (!window.tro.rolling)
        window.tro.render()
}

function mouseMove(e) {
    window.tro.cursor.x = e.x
    window.tro.cursor.y = e.y

    if (!window.tro.rolling)
        window.tro.render()
}

function mouseUp(e) {
    window.tro.cursor.down = false

    if (!window.tro.rolling)
        window.tro.render()
}

window.addEventListener('keypress', keyEvent, false)
window.addEventListener('mousedown', mouseDown, false)
window.addEventListener('mousemove', mouseMove, false)
window.addEventListener('mouseup', mouseUp, false)

window.onload = function() {
    window.dft = Module.cwrap('cdft', 'array', ['number', 'array'])

    navigator.getUserMedia = (navigator.getUserMedia ||
                              navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia ||
                              navigator.msGetUserMedia)

    var audioCtx = new (window.AudioContext || window.webkitAudioContext)()

    var jet = colormap({
        colormap: 'electric',
        nshades: 2048,
        format: 'hex',
    })

    var colormapFromNorm = function(norm, offset) {
        offset = offset || 0
        return jet[Math.floor((offset + norm*(1-offset))*jet.length - 1)]
    }

    var visualizer = function() {
        var vis = this

        vis = {}
        vis.canvas = document.createElement('canvas')
        vis.canvasCtx = vis.canvas.getContext('2d')

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
            vis.analyser.getByteTimeDomainData(vis.byteArray)

            var ptr = dft(vis.byteArray.length, vis.byteArray)
            var bytes = Module.HEAP8.subarray(ptr, ptr+vis.byteArray.length)

            if (vis.rolling) requestAnimationFrame(vis.render)

            vis.draw()
        }

        return vis
    }

    var spectrum = function() {
        var vis = new visualizer()

        vis.fftSize = 64
        vis.smoothingTimeConstant = .7

        vis.draw = function() {
            vis.canvasCtx.fillStyle = 'black'
            vis.canvasCtx.fillRect(0, 0, vis.canvas.width, vis.canvas.height)

            var barwidth = vis.canvas.width/vis.byteArray.length
            for (var i = vis.byteArray.length - 1; i >= 0; i--) {
                var x = i*barwidth+1
                var y = vis.byteArray[i]/255.0
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

        vis.fftSize = 128
        vis.smoothingTimeConstant = 0
        vis.tempCanvas = document.createElement('canvas')
        vis.tempCtx = vis.tempCanvas.getContext('2d')

        vis.logScale = false
        vis.lines = 0

        vis.cursor = {}

        vis.config = function(streamSource) {
            vis.analyser = audioCtx.createAnalyser()
            vis.analyser.fftSize = vis.fftSize
            vis.analyser.smoothingTimeConstant = vis.smoothingTimeConstant
            vis.analyser.minDecibels = -140

            streamSource.connect(vis.analyser)

            vis.canvas.width = 1440
            vis.canvas.height = 900

            vis.tempCanvas.width = vis.canvas.width
            vis.tempCanvas.height = vis.canvas.height

            vis.scaleFactor = vis.canvas.height/Math.log2(audioCtx.sampleRate/2)

            document.body.appendChild(vis.canvas)

            vis.byteArray = new Uint8Array(vis.analyser.frequencyBinCount)

            vis.render()

            return vis
        }
        vis.yFromFreq = function(freq) {
            return (Math.log2(freq)*vis.scaleFactor | 0)
        }
        vis.freqFromY = function(y) {
            var freq = Math.pow(2, y/vis.scaleFactor)
            return freq
        }
        vis.setLines = function() {
            vis.lines = (vis.lines+1)%3

            if (!vis.rolling) vis.render()
        }
        vis.draw = function() {
            var dw = 3

            vis.canvasCtx.fillStyle = 'black'

            vis.canvasCtx.fillRect(0, 0, vis.canvas.width, vis.canvas.height)
            vis.canvasCtx.drawImage(vis.tempCanvas, 0, 0)

            var boxheight = vis.canvas.height/vis.byteArray.length
            var binwidth = audioCtx.sampleRate/vis.fftSize
            var y = 0

            var freq0 = mMap.note('A2').Hz
            var blen = vis.byteArray.length
            var bin0 = Math.floor(freq0/audioCtx.sampleRate*blen*2)

            var rightPadding = 50
            var specWidth = vis.canvas.width-rightPadding

            var y0 = vis.yFromFreq(freq0)
            var sfactor = vis.canvas.height/(vis.canvas.height-y0+25)

            // draw spectrogram
            for (var i = bin0; i < blen; i++) {
                if (vis.logScale) {
                    boxheight = Math.log2((i+1)/i)*vis.scaleFactor
                    if (boxheight == Infinity)
                        boxheight = Math.log2(binwidth)*vis.scaleFactor
                    y = Math.log2(i*binwidth)*vis.scaleFactor
                    if (y < 0) y = 0
                }
                else
                    y = i*boxheight
                var norm = vis.byteArray[i]/255.0
                vis.canvasCtx.fillStyle = colormapFromNorm(norm)

                vis.canvasCtx.fillRect(specWidth-dw, (vis.canvas.height-y)*sfactor,
                    dw, -(boxheight+1)*sfactor)
            }

            if (vis.rolling) {
                vis.tempCtx.translate(-dw, 0)
                vis.tempCtx.drawImage(vis.canvas, 0, 0)
                vis.tempCtx.translate(dw, 0)
            }

            vis.canvasCtx.font = '100 18px Open Sans'
            vis.canvasCtx.textAlign = 'right'
            vis.canvasCtx.textBaseline = 'middle'

            // draw y ticks
            if (vis.logScale) {
                for (var j in As) {
                    vis.canvasCtx.fillStyle = 'white'
                    var note = As[j]
                    vis.canvasCtx.fillText(note.name,
                        vis.canvas.width-dw,
                        (vis.canvas.height-vis.yFromFreq(note.Hz))*sfactor)
                    vis.canvasCtx.fillRect(vis.canvas.width-rightPadding,
                        (vis.canvas.height-vis.yFromFreq(note.Hz))*sfactor,
                        rightPadding-30, 1)

                    if (vis.lines > 0) {
                        vis.canvasCtx.fillStyle = 'rgba(255,255,255,0.5)'
                        vis.canvasCtx.fillRect(0, (vis.canvas.height-vis.yFromFreq(note.Hz))*sfactor,
                            specWidth, 1)
                    }
                }
            }

            vis.canvasCtx.textAlign = 'center'
            vis.canvasCtx.textBaseline = 'bottom'

            // ticks every half second, 60Hz refresh rate
            var tickSpacing = 30*dw
            // draw x ticks
            var tickX = specWidth
            var specHeight = vis.canvas.height-43
            var time = 0
            while (tickX > 0) {
                vis.canvasCtx.fillStyle = 'white'
                vis.canvasCtx.fillText(time, tickX, vis.canvas.height)
                vis.canvasCtx.fillRect(tickX-1, specHeight, 1, 20)

                if (vis.lines === 2) {
                    vis.canvasCtx.fillStyle = 'rgba(255,255,255,0.5)'
                    vis.canvasCtx.fillRect(tickX-1, 0, 1, specHeight)
                }

                tickX -= tickSpacing
                time += 0.5
            }

            vis.canvasCtx.fillStyle = 'white'
            // draw cursor
            if (vis.cursor.down) {
                vis.canvasCtx.fillRect(0, vis.cursor.y, specWidth, 1)
                vis.canvasCtx.fillRect(vis.cursor.x, 0, -1, specHeight)

                var yFromY = (vis.canvas.height - vis.cursor.y/sfactor)

                // draw nearest Y label
                var nearest = mMap.nearest(vis.freqFromY(yFromY))
                var nearY = vis.yFromFreq(nearest.Hz)

                if (nearest) {
                    vis.canvasCtx.fillStyle = 'white'
                    vis.canvasCtx.textAlign = 'right'
                    vis.canvasCtx.textBaseline = 'middle'

                    vis.canvasCtx.fillText(nearest.name,
                        vis.canvas.width-dw,
                        (vis.canvas.height-nearY)*sfactor)
                    vis.canvasCtx.fillRect(vis.canvas.width-rightPadding,
                        (vis.canvas.height-nearY)*sfactor,
                        rightPadding-40, 1)
                }
            }
        }

        return vis
    }

    if (navigator.getUserMedia) {
        navigator.getUserMedia(
            { audio: true },
            function(stream) {
                var streamSource = audioCtx.createMediaStreamSource(stream)

                window.tro = new spectrogram()
                tro.config(streamSource)
            },
            function(err) {
                console.error(err)
            }
        )
    }
}