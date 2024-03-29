var colormap = require('colormap')

// just for display, tonal accuracy is "unimportant"
var musicMap = function() {
    var map = this
    var C1 = 32.7
    
    // 12 semitones 
    var factor = Math.pow(2, 1/12)
    var notes = []

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
        note *= factor
    }
    map.note = function(name) {
        return notes.find(function(n) {
            return n.name === name
        })
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
    if (e.keyCode === 32) { // spacebar
      window.tro.roll(!window.tro.rolling)
    } else if (e.keyCode === 115) {
      if (!window.audioRunning) {
        window.startAudio()
      }
    }
}

window.onload = () => {
  window.audioRunning = false
  window.addEventListener('keypress', keyEvent, false)
}

function unlockAudioContext(audioCtx) {
  if (audioCtx.state !== 'suspended') return;
  const b = document.body;
  const events = ['touchstart','touchend', 'mousedown','keydown'];
  events.forEach(e => b.addEventListener(e, unlock, false));
  function unlock() { audioCtx.resume().then(clean); }
  function clean() { events.forEach(e => b.removeEventListener(e, unlock)); }
}

window.startAudio = function() {    
    navigator.getUserMedia = (navigator.getUserMedia ||
                              navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia ||
                              navigator.msGetUserMedia)

    var audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    unlockAudioContext(audioCtx)

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

        vis.p = {}
        vis.p.canvas = document.createElement('canvas')
        vis.p.canvasCtx = vis.p.canvas.getContext('2d')

        vis.rolling = true

        vis.config = function(streamSource) {
            vis.analyser = audioCtx.createAnalyser()
            vis.analyser.fftSize = vis.p.fftSize
            vis.analyser.smoothingTimeConstant = vis.p.smoothingTimeConstant

            streamSource.connect(vis.analyser)

            vis.p.canvas.width = 1440
            vis.p.canvas.height = 900

            document.body.appendChild(vis.p.canvas)

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
        vis.genGetSet = function() {
            Object.keys(vis.p).forEach(function(key) {
                vis[key] = function(_) {
                    if (!arguments.length) return p[key]

                    p[key] = _
                    return vis
                }
            })
        }

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

        vis.p.fftSize = 4096*4
        vis.p.smoothingTimeConstant = 0
        vis.p.tempCanvas = document.createElement('canvas')
        vis.p.tempCtx = vis.p.tempCanvas.getContext('2d')

        vis.p.logScale = true

        vis.config = function(streamSource) {
            vis.analyser = audioCtx.createAnalyser()
            vis.analyser.fftSize = vis.p.fftSize
            vis.analyser.smoothingTimeConstant = vis.p.smoothingTimeConstant
            vis.analyser.minDecibels = -140

            streamSource.connect(vis.analyser)

            vis.p.canvas.width = 1440
            vis.p.canvas.height = 800

            vis.p.tempCanvas.width = vis.p.canvas.width
            vis.p.tempCanvas.height = vis.p.canvas.height

            vis.p.scaleFactor = vis.p.canvas.height/Math.log2(audioCtx.sampleRate/2)

            document.body.appendChild(vis.p.canvas)

            vis.byteArray = new Uint8Array(vis.analyser.frequencyBinCount)

            vis.render()

            return vis
        }
        vis.yFromFreq = function(freq) {
            return (Math.log2(freq)*vis.p.scaleFactor | 0 )
        }
        vis.draw = function() {
            var dw = 3

            vis.p.canvasCtx.fillStyle = 'black'
            vis.p.canvasCtx.font = '18px Helvetica'
            vis.p.canvasCtx.textAlign = 'right'

            vis.p.canvasCtx.fillRect(0, 0, vis.p.canvas.width, vis.p.canvas.height)
            vis.p.canvasCtx.drawImage(vis.p.tempCanvas, 0, 0)

            var boxheight = vis.p.canvas.height/vis.byteArray.length
            var binwidth = audioCtx.sampleRate/vis.p.fftSize
            var y = 0

            var freq0 = mMap.note('A2').Hz
            var blen = vis.byteArray.length
            var bin0 = Math.floor(freq0/audioCtx.sampleRate*blen*2)

            var y0 = vis.yFromFreq(freq0)
            var sfactor = vis.p.canvas.height/(vis.p.canvas.height-y0)
            for (var i = bin0; i < blen; i++) {
                if (vis.p.logScale) {
                    boxheight = Math.log2((i+1)/i)*vis.p.scaleFactor
                    if (boxheight == Infinity)
                        boxheight = Math.log2(binwidth)*vis.p.scaleFactor
                    y = Math.log2(i*binwidth)*vis.p.scaleFactor
                    if (y < 0) y = 0
                }
                else
                    y = i*boxheight
                var norm = vis.byteArray[i]/255.0
                vis.p.canvasCtx.fillStyle = colormapFromNorm(norm)

                vis.p.canvasCtx.fillRect(vis.p.canvas.width-dw, (vis.p.canvas.height-y)*sfactor, dw, -(boxheight+1)*sfactor)
            }

            vis.p.tempCtx.translate(-dw, 0)
            vis.p.tempCtx.drawImage(vis.p.canvas, 0, 0)
            vis.p.tempCtx.translate(dw, 0)

            if (vis.p.logScale) {
                vis.p.canvasCtx.fillStyle = 'rgba(255, 255, 255, .5)'

                for (var j in strings) {
                    var note = strings[j]
                    vis.p.canvasCtx.fillText(note.name, vis.p.canvas.width-dw, (vis.p.canvas.height-vis.yFromFreq(note.Hz))*sfactor)
                    vis.p.canvasCtx.fillRect(0, (vis.p.canvas.height-vis.yFromFreq(note.Hz))*sfactor-1, vis.p.canvas.width, 1)
                }
            }
        }

        window.audioRunning = true
        return vis
    }

    if (navigator.getUserMedia) {
        navigator.getUserMedia(
            { audio: true },
            function(stream) {
                var streamSource = audioCtx.createMediaStreamSource(stream)

                // var spec = new centerspectrum()
                // spec.config(streamSource)

                window.tro = new spectrogram()
                tro.config(streamSource)
            },
            function(err) {
                console.error(err)
            }
        )
    }
}