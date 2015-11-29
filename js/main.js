navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia)

var ac = new (window.AudioContext || window.webkitAudioContext)()

if (navigator.getUserMedia) {
   console.log('getUserMedia supported.');
   navigator.getUserMedia (
      // constraints: audio and video for this app
      {
         audio: true,
         video: true
      },

      // Success callback
      function(stream) {
         video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
         video.onloadedmetadata = function(e) {
            video.play();
            video.muted = 'true';
         };

         // Create a MediaStreamAudioSourceNode
         // Feed the HTMLMediaElement into it
         var source = audioCtx.createMediaStreamSource(stream);

          // Create a biquadfilter
          var biquadFilter = audioCtx.createBiquadFilter();
          biquadFilter.type = "lowshelf";
          biquadFilter.frequency.value = 1000;
          biquadFilter.gain.value = range.value;

          // connect the AudioBufferSourceNode to the gainNode
          // and the gainNode to the destination, so we can play the
          // music and adjust the volume using the mouse cursor
          source.connect(biquadFilter);
          biquadFilter.connect(audioCtx.destination);

          // Get new mouse pointer coordinates when mouse is moved
          // then set new gain value

          range.oninput = function() {
              biquadFilter.gain.value = range.value;
          }

          function calcFrequencyResponse() {
            biquadFilter.getFrequencyResponse(myFrequencyArray,magResponseOutput,phaseResponseOutput);

            for(i = 0; i <= myFrequencyArray.length-1;i++){
              var listItem = document.createElement('li');
              listItem.innerHTML = '' + myFrequencyArray[i] + 'Hz: Magnitude ' + magResponseOutput[i] + ', Phase ' + phaseResponseOutput[i] + ' radians.';
              freqResponseOutput.appendChild(listItem);
            }
          }

          calcFrequencyResponse();

      },

      // Error callback
      function(err) {
         console.log('The following gUM error occured: ' + err);
      }
   );
} else {
   console.log('getUserMedia not supported on your browser!');
}

if (navigator.getUserMedia) {
    navigator.getUserMedia(
        {
            audio: true,
            video: false
        },

        function(stream) {
            alert('bream')
            
            var src = ac.createMediaStreamSource(stream)

            src.connect(ac.destination)
        })
}