import subprocess
import sys
from pathlib import Path
from uuid import uuid4

from django.conf import settings


RESOLUTION_MAP = {
    "360p": "-2:360",
    "480p": "-2:480",
    "720p": "-2:720",
    "1080p": "-2:1080",
}

FORMAT_SETTINGS = {
    "mp4": [
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
    ],
    "mkv": [
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
    ],
    "webm": [
        "-c:v",
        "libvpx-vp9",
        "-c:a",
        "libopus",
    ],
}


def convert_video(input_file, output_format, resolution):
    if resolution not in RESOLUTION_MAP:
        raise ValueError("Invalid resolution")

    if output_format not in FORMAT_SETTINGS:
        raise ValueError("Invalid output format")

    if isinstance(input_file, Path):
        input_path = input_file
    else:
        input_path = Path(input_file.path)

    output_directory = (
        Path(settings.MEDIA_ROOT)
        / "videos"
        / "converted"
    )

    output_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_filename = (
        f"{input_path.stem}_{uuid4().hex}_{resolution}.{output_format}"
    )

    output_path = output_directory / output_filename

    command = [
        "ffmpeg",
        "-i",
        str(input_path),
        "-vf",
        f"scale={RESOLUTION_MAP[resolution]}",
        *FORMAT_SETTINGS[output_format],
        "-y",
        str(output_path),
    ]

    subprocess.run(
        command,
        check=True,
    )

    return output_path


def increase_fps_video(input_file, job_id):
    input_path = Path(input_file.path)

    output_directory = (
        Path(settings.MEDIA_ROOT)
        / "videos"
        / "converted"
    )

    output_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_filename = (
        f"{input_path.stem}_{job_id}_60fps.mp4"
    )

    output_path = output_directory / output_filename

    rife_script = (
        Path(__file__).resolve().parents[2]
        / "frame-interpolation"
        / "interpolate.py"
    )

    subprocess.run(
        [
            sys.executable,
            str(rife_script),
            str(input_path),
            str(output_path),
            str(job_id),
        ],
        check=True,
    )

    return output_path