"""
Nooauria MusicGen Neural Continuation Server
----------------------------------------------
Runs Meta's MusicGen (facebook/musicgen-small or facebook/musicgen-melody)
to generate neural audio extensions conditioned on audio prompt samples.
"""

import base64
import io
import os
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import torchaudio
from transformers import AutoProcessor, MusicgenForConditionalGeneration

app = FastAPI(title="Nooauria MusicGen Server")

processor = None
model = None
device = "cuda" if torch.cuda.is_available() else "cpu"

class GenerationRequest(BaseModel):
    audio_prompt_base64: str
    text_prompt: str = "EDM track extension with energetic beat and binaural vibe"
    duration_seconds: float = 10.0
    model_name: str = "facebook/musicgen-small"

@app.on_event("startup")
def load_musicgen():
    global processor, model, device
    print(f"[MusicGen] Loading model on device: {device}...")
    try:
        processor = AutoProcessor.from_pretrained("facebook/musicgen-small")
        model = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small").to(device)
        print("[MusicGen] Model successfully loaded and ready for inference!")
    except Exception as e:
        print(f"[MusicGen] Error loading model: {e}")

@app.get("/health")
def health_check():
    return {"status": "ok", "model": "facebook/musicgen-small", "device": device}

@app.post("/api/generate_extension")
def generate_extension(req: GenerationRequest):
    global processor, model, device

    if model is None or processor is None:
        raise HTTPException(status_code=503, detail="MusicGen model not loaded")

    try:
        audio_bytes = base64.b64decode(req.audio_prompt_base64)
        audio_tensor, sr = torchaudio.load(io.BytesIO(audio_bytes))

        if sr != 32000:
            resampler = torchaudio.transforms.Resample(sr, 32000)
            audio_tensor = resampler(audio_tensor)
            sr = 32000

        if audio_tensor.shape[0] > 1:
            audio_tensor = audio_tensor[0:1, :]

        max_tokens = int(req.duration_seconds * 50)
        inputs = processor(
            audio=audio_tensor.squeeze().numpy(),
            sampling_rate=sr,
            text=[req.text_prompt],
            padding=True,
            return_tensors="pt"
        ).to(device)

        print(f"[MusicGen] Generating {req.duration_seconds}s continuation for prompt...")
        with torch.no_grad():
            audio_tokens = model.generate(**inputs, max_new_tokens=max_tokens)

        output_audio = audio_tokens[0, 0].cpu()
        out_buf = io.BytesIO()
        torchaudio.save(out_buf, output_audio.unsqueeze(0), 32000, format="wav")
        out_buf.seek(0)

        encoded_wav = base64.b64encode(out_buf.read()).decode("utf-8")

        return {
            "status": "success",
            "duration": req.duration_seconds,
            "sample_rate": 32000,
            "audio_wav_base64": encoded_wav
        }

    except Exception as e:
        print(f"[MusicGen] Generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
