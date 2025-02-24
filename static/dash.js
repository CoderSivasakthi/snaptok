        function updateContent(type) {
            document.getElementById("greeting").innerText = Hi Siva! This is your ${type} practice report.;

            let reportData = document.getElementById("reportData");
            reportData.innerHTML = "";

            let data = {
                Interview: [
                    { title: "Mock Interview", date: "Feb 24", type: "Interview", time: "0:15", score: "85" },
                    { title: "Job Interview", date: "Jan 12", type: "Interview", time: "0:20", score: "90" }
                ],
                Conversation: [
                    { title: "Casual Talk", date: "Mar 10", type: "Conversation", time: "0:05", score: "75" },
                    { title: "Business Chat", date: "Jan 22", type: "Conversation", time: "0:12", score: "88" }
                ],
                Presentation: [
                    { title: "Project Pitch", date: "Apr 30", type: "Presentation", time: "0:14", score: "92" },
                    { title: "Sales Talk", date: "May 05", type: "Presentation", time: "0:07", score: "81" }
                ]
            };

            data[type].forEach(item => {
                let row = `<tr>
                    <td>${item.title}</td>
                    <td>${item.date}</td>
                    <td>${item.type}</td>
                    <td>${item.time}</td>
                    <td>${item.score}</td>
                </tr>`;
                reportData.innerHTML += row;
            });
        }