from flask import Flask, render_template, Response, request, send_file
import cv2
import os
import threading
import numpy as np
from deepface import DeepFace

app = Flask(__name__)
recording = False
output_video_path = "recordings/output.avi"
os.makedirs("recordings", exist_ok=True)
def classify_expression(emotion):
    emotion_mapping = {
        'happy': "Confident & Approachable",
        'neutral': "Confident Expression",
        'surprise': "Enthusiastic & Engaging",
        'angry': "Serious & Focused",
        'fear': "Curious & Interested",
        'sad': "Calm & Thoughtful",
        'disgust': "Displeased Expression"
    }
    return emotion_mapping.get(emotion, "Unknown")
def draw_results(frame, results):
    if not results or not isinstance(results, list):
        print("Warning: No faces detected or unexpected data format.")
        return
    for detection in results:
        region = detection.get('region', {})
        emotions = detection.get('emotion', {})
        dominant_emotion = detection.get('dominant_emotion', 'Unknown')
        expression_category = classify_expression(dominant_emotion)
        x, y, w, h = region.get('x', 0), region.get('y', 0), region.get('w', 0), region.get('h', 0)
        if all(isinstance(v, (int, float)) for v in [x, y, w, h]):
            x, y, w, h = max(int(x), 0), max(int(y), 0), max(int(w), 1), max(int(h), 1)
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            expression_text = f"{expression_category} ({emotions.get(dominant_emotion, 0) * 100:.2f}%)"
            cv2.putText(frame, expression_text, (x, max(y - 10, 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

def generate_frames():
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

    if not cap.isOpened():
        print("Error: Could not open camera")
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Failed to capture video frame.")
            break

        processed_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        try:
            results = DeepFace.analyze(processed_frame, actions=['emotion'], enforce_detection=False)
            if not isinstance(results, list):
                results = [results]
        except Exception as e:
            print(f"Error analyzing face: {e}")
            continue
        draw_results(frame, results)

        _, buffer = cv2.imencode('.jpg', frame)
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
    cap.release()

def face_recognition():
    global recording
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

    if not cap.isOpened():
        print("Error: Could not open camera")
        return

    fourcc = cv2.VideoWriter_fourcc(*'XVID')
    out = cv2.VideoWriter(output_video_path, fourcc, 20.0, (640, 480))

    while recording:
        ret, frame = cap.read()
        if not ret:
            print("Error: Failed to capture video frame during recording.")
            break

        processed_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        try:
            results = DeepFace.analyze(processed_frame, actions=['emotion'], enforce_detection=False)
            if not isinstance(results, list):
                results = [results]
        except Exception as e:
            print(f"Error analyzing face: {e}")
            continue

        draw_results(frame, results)
        out.write(frame)

    cap.release()
    out.release()
@app.route('/')
def index():
    return render_template('snaptok.html')
@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')
@app.route('/start', methods=['POST'])
def start():
    global recording
    if not recording:
        recording = True
        threading.Thread(target=face_recognition).start()
    return "Started"
@app.route('/stop', methods=['POST'])
def stop():
    global recording
    recording = False
    return "Stopped"
@app.route('/download/video')
def download_video():
    return send_file(output_video_path, as_attachment=True)
@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')
@app.route('/daily-activity')
def daily_activity():
    return render_template('daily_activity.html')
@app.route('/practice')
def practice():
    return render_template('snaptok.html')

@app.route('/load_content/<mode>')
def load_content(mode):
    if mode == 'interview':
        return render_template('interview.html')
    elif mode == 'conversation':
        return render_template('conversation.html')
    elif mode == 'presentation':
        return render_template('presentation.html')
    else:
        return "Invalid mode", 400


if __name__ == "__main__":
    app.run(debug=True)
