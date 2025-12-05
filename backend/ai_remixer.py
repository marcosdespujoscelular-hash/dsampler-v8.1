import numpy as np
import soundfile as sf
import scipy.signal
import os
from typing import List, Dict, Tuple

def analyze_slice_features(audio_path: str) -> Dict:
    """
    Analyze a single slice and extract musical features using scipy.
    
    Returns:
        dict with keys: energy, brightness, onset_strength, duration
    """
    try:
        y, sr = sf.read(audio_path)
        
        # Convert to mono if stereo
        if len(y.shape) > 1:
            y = y.mean(axis=1)
        
        # Energy (RMS)
        energy = float(np.sqrt(np.mean(y**2)))
        
        # Spectral Centroid (brightness) - simple FFT-based approach
        fft = np.abs(np.fft.rfft(y))
        freqs = np.fft.rfftfreq(len(y), 1/sr)
        brightness = float(np.sum(freqs * fft) / (np.sum(fft) + 1e-10))
        
        # Onset Strength (percussiveness) - envelope derivative
        envelope = np.abs(y)
        b, a = scipy.signal.butter(2, 10 / (sr/2), 'low')
        envelope_smooth = scipy.signal.filtfilt(b, a, envelope)
        onset_strength = float(np.mean(np.abs(np.diff(envelope_smooth))))
        
        # Duration
        duration = float(len(y) / sr)
        
        return {
            "energy": energy,
            "brightness": brightness,
            "onset_strength": onset_strength,
            "duration": duration
        }
    except Exception as e:
        print(f"Error analyzing {audio_path}: {e}")
        return {
            "energy": 0.0,
            "brightness": 0.0,
            "onset_strength": 0.0,
            "duration": 0.0
        }


def classify_slices(slices_features: List[Dict]) -> Dict[str, List[int]]:
    """
    Classify slices into categories based on their features.
    
    Categories:
    - intro: Low energy
    - build: Medium energy, increasing
    - drop: High energy, high onset
    - breakdown: Medium energy, low onset
    - outro: Low energy
    
    Returns:
        dict mapping category names to list of slice indices
    """
    if not slices_features:
        return {"intro": [], "build": [], "drop": [], "breakdown": [], "outro": []}
    
    # Extract energy values
    energies = [f["energy"] for f in slices_features]
    onsets = [f["onset_strength"] for f in slices_features]
    
    # Calculate thresholds
    energy_low = np.percentile(energies, 33)
    energy_high = np.percentile(energies, 66)
    onset_threshold = np.median(onsets)
    
    categories = {
        "intro": [],
        "build": [],
        "drop": [],
        "breakdown": [],
        "outro": []
    }
    
    for i, features in enumerate(slices_features):
        energy = features["energy"]
        onset = features["onset_strength"]
        
        if energy < energy_low:
            # Low energy -> intro or outro
            if i < len(slices_features) / 2:
                categories["intro"].append(i)
            else:
                categories["outro"].append(i)
        elif energy > energy_high and onset > onset_threshold:
            # High energy + strong onset -> drop
            categories["drop"].append(i)
        elif energy > energy_high:
            # High energy but weak onset -> build
            categories["build"].append(i)
        else:
            # Medium energy -> breakdown
            categories["breakdown"].append(i)
    
    return categories


def generate_remix_structure(categories: Dict[str, List[int]], bpm: float, target_duration: float = 60.0) -> List[Dict]:
    """
    Generate a remix sequence with musical structure.
    
    Structure:
    1. Intro (8-16 beats)
    2. Build-up (16-32 beats)
    3. Drop (32 beats)
    4. Breakdown (16 beats)
    5. Build-up (16 beats)
    6. Drop (32 beats)
    7. Outro (8-16 beats)
    
    Returns:
        List of dicts: [{"slice_index": int, "repetitions": int}, ...]
    """
    sequence = []
    
    # Helper to add slices with repetition
    def add_section(category: str, num_slices: int, reps_per_slice: int = 1):
        available = categories.get(category, [])
        if not available:
            # Fallback to any available slices
            available = [i for cat in categories.values() for i in cat]
        
        if available:
            # Select slices (with repetition if needed)
            selected = []
            for _ in range(num_slices):
                selected.append(int(np.random.choice(available)))  # Convert to native int
            
            for slice_idx in selected:
                sequence.append({
                    "slice_index": int(slice_idx),  # Ensure native int
                    "repetitions": int(reps_per_slice)  # Ensure native int
                })
    
    # Build the structure
    add_section("intro", 2, 2)           # Intro: 2 slices x 2 reps
    add_section("build", 4, 1)           # Build: 4 slices x 1 rep
    add_section("drop", 2, 4)            # Drop: 2 slices x 4 reps
    add_section("breakdown", 2, 2)       # Breakdown: 2 slices x 2 reps
    add_section("build", 2, 2)           # Build: 2 slices x 2 reps
    add_section("drop", 2, 4)            # Drop: 2 slices x 4 reps
    add_section("outro", 2, 2)           # Outro: 2 slices x 2 reps
    
    return sequence


def render_remix(sequence: List[Dict], slices_dir: str, output_path: str, crossfade_duration: float = 0.05) -> bool:
    """
    Render the remix sequence to a WAV file.
    
    Args:
        sequence: List of {"slice_index": int, "repetitions": int}
        slices_dir: Directory containing slice_*.wav files
        output_path: Where to save the final remix
        crossfade_duration: Crossfade duration in seconds
    
    Returns:
        True if successful, False otherwise
    """
    try:
        # Load all slices
        slice_files = sorted([f for f in os.listdir(slices_dir) if f.startswith("slice_") and f.endswith(".wav")])
        
        if not slice_files:
            print("No slices found")
            return False
        
        # Build the remix
        remix_audio = []
        sample_rate = None
        
        for item in sequence:
            slice_idx = item["slice_index"]
            reps = item["repetitions"]
            
            if slice_idx >= len(slice_files):
                continue
            
            slice_path = os.path.join(slices_dir, slice_files[slice_idx])
            y, sr = sf.read(slice_path)
            
            # Convert to mono
            if len(y.shape) > 1:
                y = y.mean(axis=1)
            
            if sample_rate is None:
                sample_rate = sr
            
            # Repeat the slice
            for _ in range(reps):
                remix_audio.append(y)
        
        if not remix_audio:
            print("No audio to render")
            return False
        
        # Concatenate with crossfades
        final_audio = remix_audio[0]
        crossfade_samples = int(crossfade_duration * sample_rate)
        
        for i in range(1, len(remix_audio)):
            next_slice = remix_audio[i]
            
            if len(final_audio) > crossfade_samples and len(next_slice) > crossfade_samples:
                # Apply crossfade
                fade_out = np.linspace(1, 0, crossfade_samples)
                fade_in = np.linspace(0, 1, crossfade_samples)
                
                final_audio[-crossfade_samples:] *= fade_out
                next_slice[:crossfade_samples] *= fade_in
                
                # Overlap
                final_audio[-crossfade_samples:] += next_slice[:crossfade_samples]
                final_audio = np.concatenate([final_audio, next_slice[crossfade_samples:]])
            else:
                # No crossfade, just concatenate
                final_audio = np.concatenate([final_audio, next_slice])
        
        # Save
        sf.write(output_path, final_audio, sample_rate)
        print(f"Remix saved to {output_path}")
        return True
        
    except Exception as e:
        print(f"Error rendering remix: {e}")
        return False


def generate_ai_remix(slices_dir: str, bpm: float, output_path: str) -> Tuple[bool, List[Dict], Dict]:
    """
    Main function to generate an AI remix.
    
    Returns:
        (success: bool, sequence: List[Dict], structure: Dict)
    """
    # 1. Analyze all slices
    slice_files = sorted([f for f in os.listdir(slices_dir) if f.startswith("slice_") and f.endswith(".wav")])
    
    if not slice_files:
        return False, [], {}
    
    print(f"Analyzing {len(slice_files)} slices...")
    features = []
    for slice_file in slice_files:
        slice_path = os.path.join(slices_dir, slice_file)
        feat = analyze_slice_features(slice_path)
        features.append(feat)
    
    # 2. Classify slices
    categories = classify_slices(features)
    print(f"Classification: {categories}")
    
    # 3. Generate structure
    sequence = generate_remix_structure(categories, bpm)
    
    # 4. Render
    success = render_remix(sequence, slices_dir, output_path)
    
    return success, sequence, categories
