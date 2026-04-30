import os
import io
import warnings
import numpy as np
from flask import Flask, request, jsonify
from moviepy import VideoFileClip

# Suppress PyTorch/Whisper warnings for cleaner logs
warnings.filterwarnings("ignore")

app = Flask(__name__)

# Pre-load the ML model into memory when server starts
print("[1/2] Loading Local Whisper AI Model (this may take a minute on first run)...")
import whisper
# Upgraded to "medium" - Large-v3 will likely crash a laptop's RAM during prototyping, but medium is extremely robust for accents!
model = whisper.load_model("medium")
print("[2/2] Model Loaded! Local ML AI Server is running and waiting for Go backend requests.")

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
        
    file = request.files['video']
    temp_path = f"temp_{file.filename}"
    file.save(temp_path)
    
    try:
        print(f"📥 Received video: {file.filename}")
        print("🎵 Extracting audio and bypassing FFmpeg missing errors...")
        
        # 1. Use MoviePy to safely extract a WAV file bypassing global FFmpeg bugs
        wav_path = temp_path + ".wav"
        clip = VideoFileClip(temp_path)
        clip.audio.write_audiofile(wav_path, fps=16000, nbytes=2, codec='pcm_s16le', logger=None)
        clip.close()
        
        # 2. Read the binary WAV data purely into a numpy array (exactly how Whisper does it internally)
        import wave
        with wave.open(wav_path, 'rb') as wf:
            data = wf.readframes(wf.getnframes())
            channels = wf.getnchannels()
            arr = np.frombuffer(data, dtype=np.int16)
            
            # 3. Downmix stereo to mono
            if channels == 2:
                arr = arr.reshape(-1, 2).mean(axis=1)
                
            # 4. Scale to Float32 [-1.0, 1.0] matching PyTorch requirements
            audio_array = arr.astype(np.float32) / 32768.0
        
        print(f"🧠 ML Model is now analyzing {temp_path}... (Depending on your PC, this might take a minute!)")
        
        # 5. Applied Claude's Advanced Search Parameters for Indian English
        result = model.transcribe(
            audio_array, 
            condition_on_previous_text=False, 
            no_speech_threshold=0.6, 
            language="en",
            beam_size=10,
            best_of=10,
            temperature=0.0,
            patience=2.0,
            initial_prompt="The following is a technical software engineering meeting spoken in an Indian English accent. The speakers may use words like API, frontend, backend, database, sprint, dashboard, React, and Go."
        )
        
        transcript = result["text"]
        
        # Cleanup the temp wav file immediately after
        if os.path.exists(wav_path):
            try:
                os.remove(wav_path)
            except:
                pass
        
        print("✅ Analysis Complete! Returning transcription to Go Backend.")
        return jsonify({"success": True, "notes": transcript.strip()})
        
    except Exception as e:
        print(f"❌ Error during transcription: {e}")
        return jsonify({"error": str(e)}), 500
        
    finally:
        # Always clean up the temp physical file
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass

@app.route('/summarize', methods=['POST'])
def summarize():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    notes = data.get('notes', '')
    if not notes:
        return jsonify({"error": "No notes provided"}), 400
        
    print(f"🧠 ML Summarizer: Analyzing {len(notes)} characters...")
    
    lines = [line.strip() for line in notes.split('\n') if line.strip()]
    summary = ""
    if len(lines) > 0:
        summary = lines[0] 
        if len(lines) > 1:
            summary += " " + lines[1]
            
    decisions = []
    action_items = []
    
    keywords_decision = ["decided", "decision", "conclusion", "finalized", "agreed"]
    keywords_action = ["to do", "action item", "must", "should", "will", "assigned to"]
    
    for line in lines:
        line_low = line.lower()
        if any(kd in line_low for kd in keywords_decision):
            decisions.append(line)
        if any(ka in line_low for ka in keywords_action) or ":" in line:
            if len(line) > 5:
                action_items.append({
                    "title": line,
                    "owner": "Unassigned",
                    "due": (np.datetime64('now') + np.timedelta64(7, 'D')).astype(str) # 7 days from now
                })

    # Slice safely
    final_decisions = decisions[:5]
    final_actions = action_items[:6]
    
    if not final_decisions: final_decisions = ["Meeting held to discuss project status."]
    if not final_actions: final_actions = [{"title": "Review meeting minutes", "owner": "Everyone", "due": "2026-03-25"}]

    return jsonify({
        "summary": summary[:200] + "..." if len(summary) > 200 else summary,
        "decisions": final_decisions,
        "action_items": final_actions
    })

if __name__ == '__main__':
    # Run the private ML server locally on a different port than Go (Port 5001)
    app.run(port=5001, debug=False)
