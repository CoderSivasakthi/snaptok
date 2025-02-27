document.addEventListener("DOMContentLoaded", () => {
    let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";
    let lastSpeechTime = Date.now();
    let silenceInterval = null;
    let repeatedWords = new Set();

    let startTime, timerInterval;
    let textBox = document.getElementById("textBox");
    let silenceTextArea = document.getElementById("silenceLog");
    let unwantedWordsArea = document.getElementById("unwantedWords");
    let timerDisplay = document.getElementById("timer");
    let titleInputContainer = document.getElementById("titleInputContainer");
    let speechTitleInput = document.getElementById("speechTitleInput");

    // Start Button
    document.getElementById("start-btn").addEventListener("click", () => {
        recognition.start();
        startTime = Date.now();
        startTimer();
        resetData();
        titleInputContainer.style.display = "none"; // Hide title input
        startSilenceDetection();
    });

    // Stop Button
    document.getElementById("stop-btn").addEventListener("click", () => {
        recognition.stop();
        stopTimer();
        clearInterval(silenceInterval);
        titleInputContainer.style.display = "block"; // Show title input
    });

    // Start Timer
    function startTimer() {
        timerInterval = setInterval(() => {
            let elapsed = Math.floor((Date.now() - startTime) / 1000);
            let minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
            let seconds = String(elapsed % 60).padStart(2, '0');
            timerDisplay.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    // Stop Timer
    function stopTimer() {
        clearInterval(timerInterval);
    }

    // Reset data when starting new speech
    function resetData() {
        finalTranscript = "";
        repeatedWords.clear();
        textBox.textContent = "Listening...";
        silenceTextArea.value = "";
        unwantedWordsArea.value = "";
        lastSpeechTime = Date.now();
    }

    // Speech Recognition Result Handling
    recognition.onresult = (event) => {
        clearInterval(silenceInterval);
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            let transcript = event.results[i][0].transcript.trim();
            lastSpeechTime = Date.now();

            if (event.results[i].isFinal) {
                finalTranscript += transcript + " ";
            } else {
                interimTranscript += transcript + " ";
            }
        }

        let processedText = finalTranscript + interimTranscript;
        let wordsArray = processedText.split(/\s+/).map(word => escapeHTML(word));

        let highlightedText = wordsArray.map((word, index, arr) => {
            if (index > 0 && word === arr[index - 1]) {
                repeatedWords.add(word);
                return `<span style="color: blue;">${word}</span>`;
            }
            return word;
        }).join(" ");

        textBox.textContent = removeHTMLTags(highlightedText);
        updateUnwantedWords();
        startSilenceDetection();
    };

    // Detect Silence (If no speech detected for 4+ seconds)
    function startSilenceDetection() {
        clearInterval(silenceInterval);
        silenceInterval = setInterval(() => {
            let currentTime = Date.now();
            if ((currentTime - lastSpeechTime) / 1000 >= 4) {
                let silenceTime = new Date().toLocaleTimeString();
                silenceTextArea.value += `Silence detected at: ${silenceTime}\n`;
            }
        }, 1000);
    }

    // Update Unwanted Words Box
    function updateUnwantedWords() {
        unwantedWordsArea.value = Array.from(repeatedWords).join(", ");
    }

    // Escape HTML Special Characters
    function escapeHTML(text) {
        let div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    // Remove HTML Tags (Prevents rendering of unwanted HTML inside text box)
    function removeHTMLTags(text) {
        let div = document.createElement("div");
        div.innerHTML = text;
        return div.textContent || div.innerText;
    }

    // Speech Title Input Handling
    speechTitleInput.addEventListener("input", () => {
        console.log("Speech Title Entered:", speechTitleInput.value);
    });

    // Handle Speech Recognition Errors
    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
    };
});
document.getElementById("presentation-btn").addEventListener("click", function() {
    window.location.href = "/presentation";
});
