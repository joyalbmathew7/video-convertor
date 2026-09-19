from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from videos.models import VideoConversion


class Command(BaseCommand):
    help = "Delete expired video files and database records."

    def handle(self, *args, **options):
        now = timezone.now()

        conversions = VideoConversion.objects.all()

        deleted_count = 0

        for video in conversions:
            if video.user is None:
                expiry_time = video.created_at + timedelta(hours=1)
            else:
                expiry_time = video.created_at + timedelta(hours=24)

            if now >= expiry_time:
                if video.original_file:
                    video.original_file.delete(
                        save=False
                    )

                if video.converted_file:
                    video.converted_file.delete(
                        save=False
                    )

                video.delete()

                deleted_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Deleted {deleted_count} expired video(s)."
            )
        )