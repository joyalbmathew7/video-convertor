from rest_framework import serializers
from .models import VideoConversion


class VideoUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoConversion
        fields = [
            "id",
            "original_file",
            "output_format",
            "resolution",
            "converted_file",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "output_format",
            "resolution",
            "converted_file",
            "created_at",
        ]