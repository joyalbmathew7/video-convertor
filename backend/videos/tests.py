from datetime import timedelta
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIRequestFactory

from .quota import (
	MAX_ANONYMOUS_FILE_SIZE,
	MAX_AUTHENTICATED_FILE_SIZE,
	check_anonymous_quota,
	check_authenticated_quota,
)
from .serializers import VideoUploadSerializer
from .views import PublicResolutionConvertView

from .models import VideoConversion


class CleanupVideosCommandTests(TestCase):
	def test_deletes_video_files_and_record_after_24_hours(self):
		with TemporaryDirectory() as media_root:
			with override_settings(MEDIA_ROOT=media_root):
				video = VideoConversion.objects.create(
					original_file=ContentFile(
						b"original", name="original.mp4"
					),
				)
				video.converted_file.save(
					"converted.mp4",
					ContentFile(b"converted"),
				)
				VideoConversion.objects.filter(pk=video.pk).update(
					created_at=timezone.now() - timedelta(hours=24, minutes=1)
				)

				call_command("cleanup_videos")

				self.assertFalse(
					VideoConversion.objects.filter(pk=video.pk).exists()
				)
				self.assertFalse(video.original_file.storage.exists(
					video.original_file.name
				))
				self.assertFalse(video.converted_file.storage.exists(
					video.converted_file.name
				))

	def test_keeps_video_created_within_24_hours(self):
		with TemporaryDirectory() as media_root:
			with override_settings(MEDIA_ROOT=media_root):
				video = VideoConversion.objects.create(
					original_file=ContentFile(
						b"original", name="original.mp4"
					),
				)

				call_command("cleanup_videos")

				self.assertTrue(
					VideoConversion.objects.filter(pk=video.pk).exists()
				)


class FileSizeLimitTests(TestCase):
	def make_file(self, size):
		uploaded_file = SimpleUploadedFile(
			"video.mp4",
			b"video",
			content_type="video/mp4",
		)
		uploaded_file.size = size
		return uploaded_file

	def test_guest_file_below_100_mb_is_accepted(self):
		request = type("Request", (), {"session": {}})()

		check_anonymous_quota(
			request,
			self.make_file(MAX_ANONYMOUS_FILE_SIZE),
		)

	def test_guest_file_above_100_mb_is_rejected(self):
		request = type("Request", (), {"session": {}})()

		with self.assertRaisesMessage(
			ValueError,
			"Maximum video size for guests is 100 MB.",
		):
			check_anonymous_quota(
				request,
				self.make_file(MAX_ANONYMOUS_FILE_SIZE + 1),
			)

	def test_authenticated_file_below_1_gb_is_accepted(self):
		user = type("User", (), {})()

		with patch(
			"videos.quota.get_authenticated_usage",
			return_value=0,
		):
			check_authenticated_quota(
				user,
				self.make_file(MAX_AUTHENTICATED_FILE_SIZE),
			)

	def test_authenticated_file_above_1_gb_is_rejected(self):
		user = type("User", (), {})()

		with self.assertRaisesMessage(
			ValueError,
			"Maximum video size for logged-in users is 1 GB.",
		):
			check_authenticated_quota(
				user,
				self.make_file(MAX_AUTHENTICATED_FILE_SIZE + 1),
			)

	def test_authenticated_serializer_rejects_before_save(self):
		serializer = VideoUploadSerializer(
			data={
				"original_file": self.make_file(
					MAX_AUTHENTICATED_FILE_SIZE + 1
				),
			}
		)

		self.assertFalse(serializer.is_valid())
		self.assertEqual(
			serializer.errors["original_file"][0],
			"Maximum video size for logged-in users is 1 GB.",
		)
		self.assertEqual(VideoConversion.objects.count(), 0)

	def test_public_endpoint_rejects_before_creating_record(self):
		request = APIRequestFactory().post(
			"/api/v1/videos/public/convert/",
			{
				"video": self.make_file(MAX_ANONYMOUS_FILE_SIZE + 1),
				"output_format": "mp4",
				"resolution": "720p",
			},
			format="multipart",
		)
		request.FILES["video"].size = MAX_ANONYMOUS_FILE_SIZE + 1
		request.session = {}

		with patch(
			"videos.views.VideoConversion.objects.create"
		) as create_video, patch(
			"videos.views.convert_video"
		) as convert_video:
			response = PublicResolutionConvertView.as_view()(request)

		self.assertEqual(response.status_code, 400)
		self.assertEqual(
			response.data["error"],
			"Maximum video size for guests is 100 MB.",
		)
		create_video.assert_not_called()
		convert_video.assert_not_called()

# Create your tests here.
