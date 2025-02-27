let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = true;

        let finalTranscript = "";
        let lastSpeechTime = Date.now();
        let silenceInterval = null;
        let silencePositions = [];

        const textBox = document.getElementById('textBox');
        const silenceTextArea = document.getElementById('silenceLog');
        const unwantedWordsArea = document.getElementById('unwantedWords');

        document.getElementById("start-btn").addEventListener("click", startRecording);
        document.getElementById("stop-btn").addEventListener("click", stopRecording);

        function startRecording() {
        fetch('/start', { method: 'POST' })  // This starts face recognition
        .then(response => console.log("Face recognition started"))
        .catch(error => console.error("Error:", error));
            recognition.start();
            finalTranscript = "";
            silencePositions = [];
            textBox.textContent = "Listening...";
            silenceTextArea.value = "";
            unwantedWordsArea.value = "";
            lastSpeechTime = Date.now();
            startSilenceDetection();
        }

        function stopRecording() {
            recognition.stop();
            clearInterval(silenceInterval);
        }

        recognition.onresult = (event) => {
            clearInterval(silenceInterval);

            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                let transcript = event.results[i][0].transcript.trim();
                lastSpeechTime = Date.now();

                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript + ' ';
                }
            }

            let processedText = finalTranscript + interimTranscript;

            silencePositions.forEach(pos => {
                processedText = insertSilenceAt(processedText, pos);
            });

            processedText = highlightRepeatedWords(processedText);

            textBox.innerHTML = processedText;
            moveCursorToEnd();
            startSilenceDetection();
        };

        function startSilenceDetection() {
            clearInterval(silenceInterval);
            silenceInterval = setInterval(() => {
                let currentTime = Date.now();
                let silenceDuration = (currentTime - lastSpeechTime) / 1000;

                if (silenceDuration >= 4) {
                    let silenceEndTime = new Date().toLocaleTimeString();
                    silenceTextArea.value += `Silence detected at: ${silenceEndTime}\n`;

                    let cursorPosition = textBox.textContent.length;
                    silencePositions.push(cursorPosition);

                    let updatedText = insertSilenceAt(textBox.innerHTML, cursorPosition);
                    textBox.innerHTML = updatedText;
                    moveCursorToEnd();
                }
            }, 1000);
        }

        function insertSilenceAt(text, position) {
            return text.slice(0, position) + '_' + text.slice(position);
        }

        function highlightRepeatedWords(text) {
            return text.replace(/\b(\w+)\s+\1\b|\b(\w)\2{2,}\b/gi, (match) => {
                return `${match}`;
            });
        }

        function moveCursorToEnd() {
            let range = document.createRange();
            let sel = window.getSelection();
            range.selectNodeContents(textBox);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }