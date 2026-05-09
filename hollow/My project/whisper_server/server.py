"""Optional voice-command sidecar for Hollow. Run: python server.py"""

import os
import tempfile

from flask import Flask, jsonify, request

app = Flask(__name__)

_model = None


def get_model():
    global _model
    if _model is None:
        import whisper

        _model = whisper.load_model("base")
    return _model


@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "no audio"}), 400

    audio_file = request.files["audio"]
    model = get_model()

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        audio_file.save(tmp.name)
        path = tmp.name

    try:
        result = model.transcribe(path)
    finally:
        os.unlink(path)

    text = (result.get("text") or "").strip().lower()
    return jsonify({"text": text, "language": result.get("language", "")})


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
