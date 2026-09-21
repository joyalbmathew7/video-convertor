import subprocess
from pathlib import Path
import shutil
from fractions import Fraction
import json
import math
import os


SCRIPT_DIR = Path(__file__).resolve().parent
RIFE_DIR = SCRIPT_DIR / "rife-ncnn-vulkan-20221029-ubuntu"

RIFE_EXE = RIFE_DIR / "rife-ncnn-vulkan"

TARGET_FPS = 60


def get_video_info(input_video):
    result = subprocess.run(
        [
            "ffprobe",
            "-v", "error",
            "-select_streams", "v:0",
            "-show_entries",
            "stream=avg_frame_rate,r_frame_rate,duration:format=duration",
            "-of", "json",
            str(input_video),
        ],
        capture_output=True,
        text=True,
        check=True,
    )

    data = json.loads(result.stdout)
    stream = data["streams"][0]

    avg_fps = float(Fraction(stream["avg_frame_rate"]))
    duration_value = stream.get("duration") or data.get("format", {}).get("duration")

    if not duration_value:
        raise ValueError("Video duration could not be determined.")

    duration = float(duration_value)

    return avg_fps, duration


def interpolate_video(input_video, output_video, job_id):
    input_video = Path(input_video).expanduser()
    output_video = Path(output_video).expanduser()

    print("Analyzing video...")

    source_fps, duration = get_video_info(input_video)

    print(f"Source FPS: {source_fps:.3f}")
    print(f"Duration: {duration:.3f} seconds")
    print(f"Target FPS: {TARGET_FPS}")

    # Calculate how many frames the final 60 FPS video needs.
    target_frame_count = math.ceil(duration * TARGET_FPS)

    print(f"Target frame count: {target_frame_count}")

    work_dir = SCRIPT_DIR / "processing" / f"job_{job_id}"
    input_frames = work_dir / "input-frames"
    output_frames = work_dir / "output-frames"

    input_frames.mkdir(parents=True)
    output_frames.mkdir(parents=True)

    try:
        # --------------------------------------------------
        # If already 60 FPS or higher
        # --------------------------------------------------

        if source_fps >= TARGET_FPS:
            print()
            print("Source is already 60 FPS or higher.")
            print("No RIFE interpolation needed.")

            subprocess.run(
                [
                    "ffmpeg",
                    "-i", str(input_video),
                    "-vf", f"fps={TARGET_FPS}",
                    "-map", "0:v:0",
                    "-map", "0:a?",
                    "-c:v", "libx264",
                    "-preset", "medium",
                    "-crf", "20",
                    "-pix_fmt", "yuv420p",
                    "-c:a", "aac",
                    "-t", str(duration),
                    str(output_video),
                ],
                check=True,
            )

            print()
            print("DONE!")
            print(f"Output: {output_video}")
            return

        # --------------------------------------------------
        # Step 1: Extract original frames
        # --------------------------------------------------

        print()
        print("Step 1: Extracting original frames...")

        subprocess.run(
            [
                "ffmpeg",
                "-i", str(input_video),
                "-fps_mode", "passthrough",
                str(input_frames / "%08d.png"),
            ],
            check=True,
        )

        # --------------------------------------------------
        # Step 2: RIFE interpolation
        # --------------------------------------------------

        print()
        print("Step 2: Running RIFE interpolation...")
        print(f"RIFE target frame count: {target_frame_count}")

        subprocess.run(
            [
                str(RIFE_EXE),
                "-i", str(input_frames),
                "-o", str(output_frames),
                "-g", os.environ.get("RIFE_GPU_ID", "-1"),
                "-m", str(RIFE_DIR / "rife-v4.6"),
                "-n", str(target_frame_count),
            ],
            check=True,
        )

        # --------------------------------------------------
        # Step 3: Create final 60 FPS video
        # --------------------------------------------------

        print()
        print("Step 3: Creating final 60 FPS video...")

        subprocess.run(
            [
                "ffmpeg",
                "-framerate", str(TARGET_FPS),
                "-i", str(output_frames / "%08d.png"),
                "-i", str(input_video),

                "-map", "0:v:0",
                "-map", "1:a?",

                "-c:v", "libx264",
                "-preset", "medium",
                "-crf", "20",
                "-pix_fmt", "yuv420p",

                "-c:a", "aac",

                "-t", str(duration),

                str(output_video),
            ],
            check=True,
        )

        print()
        print("================================")
        print("DONE!")
        print("================================")
        print(f"Output: {output_video}")
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


if __name__ == "__main__":
    if __name__ == "__main__":
        import sys

        if len(sys.argv) != 4:
            print("Usage: python interpolate.py input_video output_video job_id")
            sys.exit(1)

        input_video = sys.argv[1]
        output_video = sys.argv[2]

        interpolate_video(input_video, output_video, sys.argv[3])