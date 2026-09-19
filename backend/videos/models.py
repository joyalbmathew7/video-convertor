from django.conf import settings
from django.db import models


class VideoConversion(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="video_conversions",
        null=True,
        blank=True,
    )

    original_file = models.FileField(upload_to="videos/original/")
    output_format = models.CharField(max_length=10, blank=True, default="")
    resolution = models.CharField(max_length=10, blank=True, default="")

    converted_file = models.FileField(
        upload_to="videos/converted/",
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.output_format} - {self.resolution}"