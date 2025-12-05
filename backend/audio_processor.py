import numpy as np
import soundfile as sf
import scipy.signal
import scipy.fft
import os

def detect_key(y, sr):
    # Use a central segment for better detection
    duration = len(y) / sr
    if duration > 30:
        start = int(len(y) // 2 - 10 * sr)
        end = int(len(y) // 2 + 10 * sr)
        y_segment = y[start:end]
    else:
        y_segment = y

    N = len(y_segment)
    yf = scipy.fft.rfft(y_segment)
    xf = scipy.fft.rfftfreq(N, 1 / sr)
    
    magnitude = np.abs(yf)
    
    min_freq = 60
    max_freq = 1000
    valid_indices = np.where((xf > min_freq) & (xf < max_freq))[0]
    
    chroma = np.zeros(12)
    
    for idx in valid_indices:
        freq = xf[idx]
        mag = magnitude[idx]
        
        if freq > 0:
            midi_note = 12 * np.log2(freq / 440.0) + 69
            chroma_idx = int(round(midi_note)) % 12
            chroma[chroma_idx] += mag
            
    notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    key_idx = np.argmax(chroma)
    key = notes[key_idx]
    
    return key

def analyze_audio(file_path):
    y, sr = sf.read(file_path)
    if len(y.shape) > 1:
        y = y.mean(axis=1)
    
    target_sr = 200
    if sr > target_sr:
        secs = len(y) / sr
        num_samples = int(secs * target_sr)
        y_resampled = scipy.signal.resample(y, num_samples)
        sr_resampled = target_sr
    else:
        y_resampled = y
        sr_resampled = sr

    envelope = np.abs(y_resampled)
    b, a = scipy.signal.butter(2, 5 / (sr_resampled/2), 'low')
    envelope = scipy.signal.filtfilt(b, a, envelope)
    
    min_bpm = 60
    max_bpm = 180
    min_lag = int(60 * sr_resampled / max_bpm)
    max_lag = int(60 * sr_resampled / min_bpm)
    
    corr = np.correlate(envelope, envelope, mode='full')
    corr = corr[len(corr)//2:]
    
    window = corr[min_lag:max_lag]
    if len(window) == 0:
        bpm = 120.0
    else:
        peak_idx = np.argmax(window)
        true_lag = min_lag + peak_idx
        if true_lag == 0:
            bpm = 120.0
        else:
            bpm = 60 * sr_resampled / true_lag

    bpm = round(bpm)
    key = detect_key(y, sr)

    return {
        "bpm": float(bpm),
        "time_signature": "4/4",
        "duration": len(y) / sr,
        "key": key,
        "kick_recommendation": key
    }

def detect_kick_onsets(y, sr):
    """
    Advanced kick detection focusing on low frequencies (20-150Hz)
    Returns precise onset times for kick drum hits at the exact attack point
    """
    # Isolate kick frequencies (20-150Hz)
    sos_low = scipy.signal.butter(6, [20, 150], 'bandpass', fs=sr, output='sos')
    y_kick = scipy.signal.sosfilt(sos_low, y)
    
    # Calculate energy envelope
    envelope = np.abs(y_kick)
    
    # Very short smoothing to preserve attack transients
    window_ms = 3  # 3ms window for very precise attack detection
    window_samples = int(sr * window_ms / 1000)
    if window_samples % 2 == 0:
        window_samples += 1
    if window_samples < 3:
        window_samples = 3
    
    envelope_smooth = scipy.signal.savgol_filter(envelope, window_samples, 1)
    
    # Calculate derivative to find sharp increases (attacks)
    envelope_diff = np.diff(envelope_smooth)
    envelope_diff = np.concatenate([[0], envelope_diff])  # Pad to same length
    
    # Adaptive threshold based on signal statistics
    threshold = np.mean(envelope_smooth) + 2.0 * np.std(envelope_smooth)
    
    # Find peaks in the derivative (attack points)
    min_distance_samples = int(sr * 0.15)  # Minimum 150ms between kicks
    
    # First find energy peaks
    energy_peaks, _ = scipy.signal.find_peaks(
        envelope_smooth,
        height=threshold,
        distance=min_distance_samples,
        prominence=threshold * 0.3
    )
    
    # For each energy peak, find the exact attack point by looking backwards
    # for the point where energy starts rising sharply
    precise_onsets = []
    
    for peak in energy_peaks:
        # Look backwards from peak to find attack start
        search_window = int(sr * 0.05)  # Search 50ms before peak
        start_idx = max(0, peak - search_window)
        
        # Find the point where derivative is maximum (sharpest rise)
        if start_idx < peak:
            window_diff = envelope_diff[start_idx:peak]
            if len(window_diff) > 0:
                max_diff_idx = np.argmax(window_diff)
                attack_point = start_idx + max_diff_idx
                
                # Further refine: find zero-crossing or minimum energy just before attack
                refine_window = int(sr * 0.01)  # 10ms refinement window
                refine_start = max(0, attack_point - refine_window)
                
                if refine_start < attack_point:
                    refine_segment = envelope_smooth[refine_start:attack_point]
                    if len(refine_segment) > 0:
                        min_energy_idx = np.argmin(refine_segment)
                        precise_attack = refine_start + min_energy_idx
                    else:
                        precise_attack = attack_point
                else:
                    precise_attack = attack_point
                
                precise_onsets.append(precise_attack)
            else:
                precise_onsets.append(peak)
        else:
            precise_onsets.append(peak)
    
    # Convert to time
    onset_times = np.array(precise_onsets) / sr
    
    return onset_times

def find_first_kick(y, sr, bpm):
    """
    Find the very first kick in the song to establish the grid
    """
    # Analyze first 10 seconds
    analysis_duration = min(10.0, len(y) / sr)
    analysis_samples = int(analysis_duration * sr)
    y_start = y[:analysis_samples]
    
    # Detect kicks in the beginning
    kicks = detect_kick_onsets(y_start, sr)
    
    if len(kicks) == 0:
        return 0.0
    
    # Return the first strong kick
    return kicks[0]

def align_to_musical_grid(onset_times, bpm, time_signature_str="4/4"):
    """
    Align detected onsets to a musical grid based on BPM
    """
    try:
        numerator, _ = map(int, time_signature_str.split('/'))
    except:
        numerator = 4
    
    seconds_per_beat = 60.0 / bpm
    seconds_per_measure = seconds_per_beat * numerator
    
    if len(onset_times) == 0:
        return onset_times
    
    # Create theoretical grid starting from first onset
    first_onset = onset_times[0]
    
    # Align each onset to nearest grid point
    aligned_onsets = []
    for onset in onset_times:
        # Calculate which measure this should be in
        measure_num = round((onset - first_onset) / seconds_per_measure)
        grid_time = first_onset + (measure_num * seconds_per_measure)
        
        # Only use if close enough to grid (within 50ms)
        if abs(onset - grid_time) < 0.05:
            aligned_onsets.append(grid_time)
        else:
            aligned_onsets.append(onset)
    
    return np.array(aligned_onsets)

def find_nearest_onset(target_time, onset_times, tolerance=0.05):
    """
    Find the nearest onset to a target time within tolerance
    Reduced tolerance to 50ms for more precision
    """
    if len(onset_times) == 0:
        return target_time
    
    differences = np.abs(onset_times - target_time)
    min_idx = np.argmin(differences)
    
    if differences[min_idx] <= tolerance:
        return onset_times[min_idx]
    return target_time

def slice_audio(file_path, output_dir, bpm, time_signature_str="4/4", measures_per_slice=1, kick_offset=0.0):
    y, sr = sf.read(file_path)
    
    # Convert to mono if stereo
    if len(y.shape) > 1:
        y = y.mean(axis=1)
    
    # Detect kick onsets with improved algorithm
    try:
        kick_onsets = detect_kick_onsets(y, sr)
        
        # Apply kick offset (in seconds)
        if kick_offset != 0:
            kick_onsets = kick_onsets + kick_offset
            # Ensure onsets are within bounds
            kick_onsets = kick_onsets[kick_onsets >= 0]
            kick_onsets = kick_onsets[kick_onsets < len(y) / sr]
        
        print(f"Detected {len(kick_onsets)} kicks (offset: {kick_offset*1000:.1f}ms)")
    except Exception as e:
        print(f"Kick detection failed: {e}")
        kick_onsets = np.array([])
    
    try:
        numerator, denominator = map(int, time_signature_str.split('/'))
    except:
        numerator, denominator = 4, 4

    seconds_per_beat = 60.0 / bpm
    seconds_per_measure = seconds_per_beat * numerator
    seconds_per_slice = seconds_per_measure * measures_per_slice
    
    total_samples = len(y)
    total_duration = total_samples / sr
    
    slices = []
    slice_count = 1
    
    if len(kick_onsets) == 0:
        # Fallback: time-based slicing if no kicks detected
        print("No kicks detected, using time-based slicing")
        current_time = 0.0
        while current_time < total_duration:
            start_sample = int(current_time * sr)
            end_time = min(current_time + seconds_per_slice, total_duration)
            end_sample = int(end_time * sr)
            
            if start_sample >= total_samples:
                break
                
            segment = y[start_sample:end_sample]
            
            if len(segment) < sr * 0.1:
                current_time += seconds_per_slice
                continue
            
            slice_filename = f"slice_{slice_count}.wav"
            slice_path = os.path.join(output_dir, slice_filename)
            sf.write(slice_path, segment, sr)
            
            slices.append({
                "filename": slice_filename,
                "start_time": current_time,
                "end_time": end_time,
                "measure": slice_count
            })
            
            current_time += seconds_per_slice
            slice_count += 1
    else:
        # Kick-based slicing: each slice MUST start on a kick
        # and end JUST BEFORE the next kick to avoid overlap
        
        # Calculate how many kicks per slice based on measures
        beats_per_slice = numerator * measures_per_slice
        
        # If half-bar, we need to find kicks at half-measure intervals
        if measures_per_slice == 0.5:
            expected_kick_interval = seconds_per_measure / 2
        else:
            expected_kick_interval = seconds_per_measure
        
        # Group kicks into slices
        i = 0
        while i < len(kick_onsets):
            slice_start_kick = kick_onsets[i]
            slice_start_sample = int(slice_start_kick * sr)
            
            # Find the kick that should START the next slice
            # This slice should end JUST BEFORE that kick
            target_next_kick_time = slice_start_kick + seconds_per_slice
            
            # Find nearest kick to target end time
            remaining_kicks = kick_onsets[i+1:]
            if len(remaining_kicks) > 0:
                differences = np.abs(remaining_kicks - target_next_kick_time)
                nearest_idx = np.argmin(differences)
                
                # Only use if within reasonable tolerance (20% of slice duration)
                if differences[nearest_idx] < seconds_per_slice * 0.2:
                    next_kick_time = remaining_kicks[nearest_idx]
                    next_slice_start_idx = i + 1 + nearest_idx
                    
                    # End this slice JUST BEFORE the next kick
                    # Subtract a small amount (10ms) to ensure clean separation
                    slice_end_time = next_kick_time - 0.01
                else:
                    # No good kick found, use time-based end
                    slice_end_time = min(target_next_kick_time, total_duration)
                    next_slice_start_idx = i + 1
            else:
                # Last slice, use time-based end or total duration
                slice_end_time = min(target_next_kick_time, total_duration)
                next_slice_start_idx = len(kick_onsets)
            
            slice_end_sample = int(slice_end_time * sr)
            
            # Extract segment
            if slice_start_sample >= total_samples:
                break
            
            segment = y[slice_start_sample:slice_end_sample]
            
            # Skip very short segments
            if len(segment) < sr * 0.1:
                i = next_slice_start_idx
                continue
            
            # Save slice
            slice_filename = f"slice_{slice_count}.wav"
            slice_path = os.path.join(output_dir, slice_filename)
            sf.write(slice_path, segment, sr)
            
            slices.append({
                "filename": slice_filename,
                "start_time": float(slice_start_kick),
                "end_time": float(slice_end_time),
                "measure": slice_count
            })
            
            print(f"Slice {slice_count}: {slice_start_kick:.3f}s - {slice_end_time:.3f}s (duration: {slice_end_time - slice_start_kick:.3f}s)")
            
            slice_count += 1
            i = next_slice_start_idx
            
            # Safety check: don't create too many slices
            if slice_count > 1000:
                print("Safety limit reached: 1000 slices")
                break
        
    return slices

