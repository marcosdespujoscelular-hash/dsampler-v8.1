import numpy as np
import soundfile as sf
import scipy.signal
from pedalboard import Pedalboard, Compressor, Distortion, HighpassFilter, LowpassFilter, Gain
import os

def extract_kicks_only(audio_path, output_path):
    """
    Extract only kicks from audio by aggressive low-pass filtering
    and removing vocals/melodies
    """
    y, sr = sf.read(audio_path)
    
    # Convert to mono if stereo
    if len(y.shape) > 1:
        y = y.mean(axis=1)
    
    # Step 1: Isolate kick frequencies (20-150Hz) with very steep filter
    sos_kicks = scipy.signal.butter(8, [20, 150], 'bandpass', fs=sr, output='sos')
    kicks_only = scipy.signal.sosfilt(sos_kicks, y)
    
    # Step 2: Remove everything else (high-pass the original to get non-kicks)
    sos_high = scipy.signal.butter(8, 150, 'highpass', fs=sr, output='sos')
    non_kicks = scipy.signal.sosfilt(sos_high, y)
    
    # Step 3: Spectral subtraction - subtract non-kicks from original
    # This helps remove bleed from other instruments
    kicks_cleaned = kicks_only - (non_kicks * 0.1)  # Subtract 10% of high freq content
    
    # Step 4: Normalize to prevent clipping
    max_val = np.max(np.abs(kicks_cleaned))
    if max_val > 0:
        kicks_cleaned = kicks_cleaned / max_val * 0.9
    
    # Save extracted kicks
    sf.write(output_path, kicks_cleaned, sr)
    
    return output_path

def enhance_kicks(audio_path, output_path, enhancement_level=50):
    """
    Enhance kicks to make them more powerful and groovy
    
    Parameters:
    - enhancement_level: 0-100, controls intensity of enhancement
    """
    y, sr = sf.read(audio_path)
    
    # Convert to mono if stereo
    if len(y.shape) > 1:
        y = y.mean(axis=1)
    
    # Scale enhancement (0-100 to 0.0-1.0)
    intensity = enhancement_level / 100.0
    
    # Create pedalboard with effects
    board = Pedalboard([
        # 1. Compression for punch (parallel compression effect)
        Compressor(
            threshold_db=-20 * (1 - intensity * 0.5),  # More compression with higher intensity
            ratio=4 + (intensity * 6),  # 4:1 to 10:1 ratio
            attack_ms=1,  # Fast attack to catch transients
            release_ms=50,  # Quick release
        ),
        
        # 2. Subtle saturation for harmonic richness
        Distortion(
            drive_db=5 * intensity  # 0-5dB of drive
        ),
        
        # 3. Boost sub-bass frequencies
        LowpassFilter(cutoff_frequency_hz=150),  # Keep only kick range
        
        # 4. Final gain boost
        Gain(gain_db=3 + (intensity * 3))  # 3-6dB boost
    ])
    
    # Process audio
    enhanced = board(y, sr)
    
    # Normalize to prevent clipping
    max_val = np.max(np.abs(enhanced))
    if max_val > 0:
        enhanced = enhanced / max_val * 0.95
    
    # Save enhanced kicks
    sf.write(output_path, enhanced, sr)
    
    return output_path

def extract_and_enhance_kicks(audio_path, output_path, enhancement_level=50):
    """
    Combined function: extract kicks and enhance them in one step
    """
    # Create temporary file for extracted kicks
    temp_path = output_path.replace('.wav', '_temp.wav')
    
    # Step 1: Extract kicks
    extract_kicks_only(audio_path, temp_path)
    
    # Step 2: Enhance kicks
    enhance_kicks(temp_path, output_path, enhancement_level)
    
    # Clean up temp file
    if os.path.exists(temp_path):
        os.remove(temp_path)
    
    return output_path
