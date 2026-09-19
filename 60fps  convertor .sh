# 1. Go to the frame-interpolation folder
cd ~/Downloads/video-converter-online/frame-interpolation

# 2. Delete old frames and create fresh folders
rm -rf test-frames output-frames
mkdir -p test-frames output-frames

# 3. Extract frames from the video
ffmpeg -i "VIDEO_PATH_HERE" -fps_mode passthrough test-frames/%08d.png

# 4. Run RIFE AI interpolation
cd rife-ncnn-vulkan-20221029-ubuntu
./rife-ncnn-vulkan -i ../test-frames -o ../output-frames -g 0 -m rife-v4.6

# 5. Check how many frames RIFE created
ls ../output-frames | wc -l

# 6. Create the final 60 FPS video
ffmpeg -framerate 60 \
-i ../output-frames/%08d.png \
-i "VIDEO_PATH_HERE" \
-map 0:v:0 -map 1:a? \
-c:v libx264 \
-preset medium \
-crf 18 \
-pix_fmt yuv420p \
-c:a aac \
-shortest \
"VIDEO-60fps.mp4"

# 7. Verify that the final video is 60 FPS
ffprobe -v error -select_streams v:0 \
-show_entries stream=r_frame_rate \
-of default=noprint_wrappers=1 \
"VIDEO-60fps.mp4"



wget https://github.com/nihui/rife-ncnn-vulkan/releases/download/20221029/rife-ncnn-vulkan-20221029-ubuntu.zip