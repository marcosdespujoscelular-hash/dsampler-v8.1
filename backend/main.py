from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import shutil
import os
import uuid
from audio_processor import analyze_audio, slice_audio
from ai_remixer import generate_ai_remix

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.post("/analyze")
async def analyze_endpoint(file: UploadFile = File(...)):
    try:
        file_ext = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        analysis_result = analyze_audio(file_path)
        
        return {
            "filename": filename,
            "bpm": analysis_result["bpm"],
            "time_signature": analysis_result["time_signature"],
            "duration": analysis_result["duration"],
            "key": analysis_result["key"],
            "kick_recommendation": analysis_result["kick_recommendation"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/slice")
async def slice_endpoint(
    filename: str, 
    bpm: float, 
    time_signature: str, 
    measures_per_slice: float = 1.0,
    kick_offset: float = 0.0
):
    try:
        file_path = os.path.join(UPLOAD_DIR, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")

        job_id = str(uuid.uuid4())
        job_output_dir = os.path.join(OUTPUT_DIR, job_id)
        os.makedirs(job_output_dir, exist_ok=True)

        # Convert to float to handle 0.5
        measures_per_slice = float(measures_per_slice)
        kick_offset_seconds = float(kick_offset) / 1000.0  # Convert ms to seconds

        slices = slice_audio(file_path, job_output_dir, bpm, time_signature, measures_per_slice, kick_offset_seconds)
        
        return {
            "job_id": job_id,
            "slices": slices
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error slicing: {str(e)}")

@app.get("/download/{job_id}/{filename}")
async def download_slice(job_id: str, filename: str):
    file_path = os.path.join(OUTPUT_DIR, job_id, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

@app.post("/extract-kicks")
async def extract_kicks_endpoint(
    job_id: str,
    filename: str,
    enhancement_level: int = 50
):
    """
    Extract kicks from a slice and optionally enhance them
    """
    try:
        from kick_processor import extract_and_enhance_kicks
        
        # Input file path
        input_path = os.path.join(OUTPUT_DIR, job_id, filename)
        if not os.path.exists(input_path):
            raise HTTPException(status_code=404, detail="Slice not found")
        
        # Output file path (add _kicks suffix)
        output_filename = filename.replace('.wav', '_kicks.wav')
        output_path = os.path.join(OUTPUT_DIR, job_id, output_filename)
        
        # Extract and enhance kicks
        extract_and_enhance_kicks(input_path, output_path, enhancement_level)
        
        return {
            "success": True,
            "kicks_filename": output_filename,
            "message": f"Kicks extracted and enhanced at {enhancement_level}% intensity"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting kicks: {str(e)}")

@app.get("/download-kicks/{job_id}/{filename}")
async def download_kicks(job_id: str, filename: str):
    """
    Download extracted kicks file
    """
    # Look for the kicks version
    kicks_filename = filename.replace('.wav', '_kicks.wav')
    file_path = os.path.join(OUTPUT_DIR, job_id, kicks_filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Kicks file not found")
    
    return FileResponse(file_path)

@app.post("/ai-remix")
async def ai_remix_endpoint(job_id: str, bpm: float):
    """
    Generate an AI remix from all slices in a job.
    Analyzes slices, classifies them, and creates a musical structure.
    """
    try:
        slices_dir = os.path.join(OUTPUT_DIR, job_id)
        if not os.path.exists(slices_dir):
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Output path for the remix
        remix_filename = "ai_remix.wav"
        remix_path = os.path.join(slices_dir, remix_filename)
        
        # Generate the remix
        success, sequence, categories = generate_ai_remix(slices_dir, bpm, remix_path)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to generate remix")
        
        return {
            "success": True,
            "remix_filename": remix_filename,
            "sequence": sequence,
            "categories": categories,
            "message": "AI Remix generated successfully!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating remix: {str(e)}")

@app.get("/download-remix/{job_id}")
async def download_remix(job_id: str):
    """
    Download the generated AI remix
    """
    file_path = os.path.join(OUTPUT_DIR, job_id, "ai_remix.wav")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Remix not found. Generate it first using /ai-remix")
    
    return FileResponse(file_path)

