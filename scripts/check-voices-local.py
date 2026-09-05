"""Local transcript check. Model weights download once; project audio stays on this Mac."""
import argparse
import hashlib
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--offline', action='store_true', help='Require previously downloaded model weights')
args = parser.parse_args()
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
cache = ROOT / 'assets/whisper-cache.local'
model = WhisperModel('small.en', device='cpu', compute_type='int8', download_root=str(cache), local_files_only=args.offline)
clips = []
manifest = json.loads((ROOT / 'assets/source/voices.json').read_text())
for clip in manifest['clips']:
    audio = ROOT / clip['output']
    digest = hashlib.sha256(audio.read_bytes()).hexdigest()
    if digest != clip['sha256']:
        raise RuntimeError(f"Shipped voice checksum mismatch: {clip['file']}")
    segments, info = model.transcribe(str(audio), language='en', beam_size=5, vad_filter=False, condition_on_previous_text=False)
    heard = ' '.join(segment.text.strip() for segment in segments)
    matches = re.findall(r'[a-z0-9]+', heard.lower()) == re.findall(r'[a-z0-9]+', clip['transcript'].lower())
    clips.append({'file': clip['file'], 'source': clip['output'], 'sha256': digest, 'expected': clip['transcript'], 'transcribed': heard, 'matchesWords': matches, 'duration': info.duration})
    print(clip['file'] + ': ' + heard, flush=True)
revision = (cache / 'models--Systran--faster-whisper-small.en/refs/main').read_text().strip()
output = {'date': datetime.now(timezone.utc).date().isoformat(), 'method': 'faster-whisper 1.2.1, small.en, CPU int8; no expected script supplied to recognizer; local audio only', 'modelRevision': revision, 'clips': clips}
(ROOT / 'assets/source/voice-transcript-check.json').write_text(json.dumps(output, indent=2) + '\n')
if not all(clip['matchesWords'] for clip in clips):
    raise SystemExit('Transcript mismatch: review the report before promoting these takes.')
