from rest_framework import serializers
from .models import VideoConversion
from .quota import (
    MAX_AUTHENTICATED_FILE_SIZE,
    check_file_size,
)


class VideoUploadSerializer(serializers.ModelSerializer):
    def validate_original_file(self, value):
        try:
            check_file_size(value, MAX_AUTHENTICATED_FILE_SIZE)
        except ValueError as error:
            raise serializers.ValidationError(str(error))

        return value

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