document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("start-btn");
    const stopBtn = document.getElementById("stop-btn");
    const cameraBtn = document.getElementById("camera-btn");
    const micBtn = document.getElementById("mic-btn");
    const videoElement = document.getElementById("webcam-feed");
    const downloadSection = document.getElementById("download-section");
    const modeButtons = document.querySelectorAll('.mode-btn');
    const mainContent = document.querySelector('main');
    const rightPanel = document.querySelector('.right-panel');
    let stream = null;
    let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = true;
    let finalTranscript = "";

    // Dynamic Content Loader
    const clearContent = () => {
        mainContent.innerHTML = '';
        rightPanel.innerHTML = '';
    };

    const loadContent = (mode) => {
        clearContent();
        if (mode === 'interview') {
            mainContent.innerHTML = `
                <h2>Interview Mode</h2>
                <div class="top-controls">
                    <button id="start-btn" class="start-btn" onclick="startListening()">Start Interview</button>
                    <div id="timer" class="timer" >00:00</div>
                    <button id="stop-btn" class="stop-btn" onclick="stopListening()">Stop Interview</button>
                </div>
                <div class="webcam-feed">
                    <video id="webcam-feed" autoplay></video>
                </div>
            `;
            rightPanel.innerHTML = `
                <h3>Interview Insights:</h3>
                <textarea class="text-area" placeholder="Notes"></textarea>
            `;
        } else if (mode === 'conversation') {
            mainContent.innerHTML = `
                <h2>Conversation Mode</h2>
                <div class="large-text-area" id="textBox" contenteditable="true">Start your conversation...</div>
            `;
            rightPanel.innerHTML = `
                <h3>Conversation Details:</h3>
                <textarea class="text-area" placeholder="Conversation Analysis"></textarea>
            `;
        } else if (mode === 'presentation') {
            mainContent.innerHTML = `
                <h2>Presentation Mode</h2>
                <div class="webcam-feed">
                    <video id="webcam-feed" autoplay></video>
                </div>
                <div class="large-text-area" id="textBox" contenteditable="true">Presentation Notes...</div>
            `;
            rightPanel.innerHTML = `
                <h3>Presentation Feedback:</h3>
                <textarea class="text-area" placeholder="Feedback Notes"></textarea>
            `;
        }
    };

    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.getAttribute('data-type');
            loadContent(mode);
        });
    });

    // Webcam and Audio Controls
    startBtn?.addEventListener("click", async () => {
        fetch("/start", { method: "POST" });
        downloadSection.classList.add("hidden");

        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            videoElement.srcObject = stream;
        } catch (err) {
            console.error("Error accessing webcam: ", err);
        }
    });

    stopBtn?.addEventListener("click", () => {
        fetch("/stop", { method: "POST" });
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        videoElement.srcObject = null;
        downloadSection.classList.remove("hidden");
    });

    cameraBtn?.addEventListener("click", () => {
        if (stream) {
            stream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
        }
    });

    micBtn?.addEventListener("click", () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
        }
    });

    // Speech Recognition and Grammar Check
    window.onload = function () {
        let textBox = document.getElementById('textBox');
        let lastText = "";

        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                let transcript = event.results[i][0].transcript;
                transcript = transcript.replace(/\.\.\.|…/g, '');
                transcript = transcript.replace(/\s+/g, ' ').trim();
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript + ' ';
                }
            }
            textBox.innerText = finalTranscript + interimTranscript;
            if (lastText !== textBox.innerText) {
                lastText = textBox.innerText;
                checkGrammar(textBox.innerText);
            }
        };

        recognition.onspeechend = () => {
            let silenceTime = new Date().toLocaleTimeString();
            finalTranscript += ' _ ';
            textBox.innerText = finalTranscript;
        };
    };

    window.startListening = function () {
        recognition.start();
    }

    window.stopListening = function () {
        recognition.stop();
    }

    async function checkGrammar(text) {
        if (!text.trim()) return;
        let response = await fetch('https://api.languagetool.org/v2/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `text=${encodeURIComponent(text)}&language=en-US`
        });
        let data = await response.json();
        highlightErrors(data.matches, text);
    }

    function highlightErrors(errors, text) {
        let textBox = document.getElementById('textBox');
        let hesitationWords = /\b(um|uh|like|you know|hmm)\b/gi;
        text = text.replace(hesitationWords, `<span style='text-decoration: underline; color: purple;'>$1</span>`);

        let repeatedWords = /(\b\w+\b)\s+\1/gi;
        text = text.replace(repeatedWords, `<span style='text-decoration: underline; color: yellow;'>$1 $1</span>`);

        errors.forEach(error => {
            let color = 'red';
            if (error.rule.issueType === 'misspelling') color = 'blue';
            else if (error.rule.issueType === 'style') color = 'orange';
            else if (error.rule.issueType === 'word-choice') color = 'green';

            let regex = new RegExp(error.context.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            text = text.replace(regex, `<span style='text-decoration: underline; color: ${color};'>${error.context.text}</span>`);
        });

        textBox.innerHTML = text;
    }
});


