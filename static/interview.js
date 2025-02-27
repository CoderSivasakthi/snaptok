document.addEventListener("DOMContentLoaded", () => {
    let timerDisplay = document.querySelector(".timer");
    let startBtn = document.getElementById("startBtn");
    let stopBtn = document.getElementById("stopBtn");
    let questionAI = document.querySelector(".question-ai");
    let responseArea = document.querySelector(".large-text-area");
    let userName = document.getElementById("userName");
    let userBranch = document.getElementById("userBranch");
    let userDepartment = document.getElementById("userDepartment");

    let questions = [];
    let currentQuestionIndex = 0;
    let interval;
    let timeLeft = 60;
    let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

    recognition.continuous = true;
    recognition.interimResults = true;
    let finalTranscript = "";

    function startTimer(duration, callback) {
        clearInterval(interval);
        let time = duration;
        interval = setInterval(() => {
            let minutes = String(Math.floor(time / 60)).padStart(2, "0");
            let seconds = String(time % 60).padStart(2, "0");
            timerDisplay.textContent = `${minutes}:${seconds}`;
            document.querySelector(".question-timer").textContent = seconds;

            if (time === 0) {
                clearInterval(interval);
                recognition.stop();
                currentQuestionIndex++;
                displayNextQuestion();
            }
            time--;
        }, 1000);
    }

    function generateQuestions() {
        let name = userName.value || "Candidate";
        let branch = userBranch.value || "your branch";
        let department = userDepartment.value || "your department";

        questions = [
            `Hello ${name}, can you tell me about yourself?`,
            `Why did you choose ${branch} as your branch of study?`,
            `What are the key skills you have gained in ${department}?`,
            `Can you describe a project or experience related to ${branch}?`,
            `How do you see yourself contributing to this field in the next five years?`,
            `What challenges have you faced while studying ${branch}, and how did you overcome them?`,
            `What technologies or tools have you worked with related to ${department}?`,
            `What are your strengths and weaknesses?`,
            `Do you have any experience with teamwork and collaboration?`,
            `Why should we hire you?`
        ];
    }

    function speakQuestion(question) {
        let utterance = new SpeechSynthesisUtterance(question);
        speechSynthesis.speak(utterance);
    }

    function startSpeechRecognition() {
        finalTranscript = "";
        recognition.start();
        recognition.onresult = (event) => {
            let interimTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                let transcript = event.results[i][0].transcript.trim();
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + " ";
                } else {
                    interimTranscript += transcript + " ";
                }
            }
            responseArea.innerHTML = finalTranscript + interimTranscript;
        };
    }

    function moveCursorToNewLine() {
        responseArea.innerHTML += `<br><br>`;
    }

    function displayNextQuestion() {
        if (currentQuestionIndex < questions.length) {
            let question = questions[currentQuestionIndex];
            questionAI.innerHTML = `<p>${question} (<span class="question-timer">5</span>)</p>`;
            speakQuestion(question);
            moveCursorToNewLine();

            setTimeout(() => {
                startSpeechRecognition();
                startTimer(timeLeft, () => {
                    recognition.stop();
                    currentQuestionIndex++;
                    displayNextQuestion();
                });
            }, 5000);
        } else {
            questionAI.innerHTML = `<p>Interview Complete! Thank you.</p>`;
            recognition.stop();
        }
    }

    function startInterview() {
        generateQuestions();
        currentQuestionIndex = 0;
        displayNextQuestion();
    }

    startBtn.addEventListener("click", () => {
        startInterview();
    });

    stopBtn.addEventListener("click", () => {
        clearInterval(interval);
        recognition.stop();
    });

    document.getElementById("addUserBtn").addEventListener("click", generateQuestions);
});
