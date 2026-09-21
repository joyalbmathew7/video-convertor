from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

from .models import VideoConversion
from .serializers import VideoUploadSerializer
from .services import convert_video, increase_fps_video
from .quota import (
    check_authenticated_quota,
    check_anonymous_quota,
    add_anonymous_usage,
)

from django.http import FileResponse

class VideoUploadView(generics.CreateAPIView):
    serializer_class = VideoUploadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class VideoConvertView(generics.UpdateAPIView):
    serializer_class = VideoUploadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return VideoConversion.objects.filter(
            user=self.request.user
        )

    def update(self, request, *args, **kwargs):
        video = self.get_object()

        output_format = request.data.get("output_format")
        resolution = request.data.get("resolution")

        if not output_format or not resolution:
            return Response(
                {
                    "error": (
                        "output_format and resolution "
                        "are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            output_path = convert_video(
                video.original_file,
                output_format,
                resolution,
            )

        except ValueError as error:
            return Response(
                {"error": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as error:
            print(error)

            return Response(
                {"error": "Video conversion failed."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        video.output_format = output_format
        video.resolution = resolution

        relative_path = output_path.relative_to(
            settings.MEDIA_ROOT
        )

        video.converted_file.name = str(relative_path)

        video.save()

        return Response(
            VideoUploadSerializer(video).data,
            status=status.HTTP_200_OK,
        )


class PublicResolutionConvertView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        video_file = request.FILES.get("video")
        output_format = request.data.get("output_format")
        resolution = request.data.get("resolution")

        if not video_file:
            return Response(
                {"error": "Video file is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not output_format or not resolution:
            return Response(
                {
                    "error": (
                        "output_format and resolution "
                        "are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            if request.user.is_authenticated:
                check_authenticated_quota(
                    request.user,
                    video_file,
                )
            else:
                check_anonymous_quota(
                    request,
                    video_file,
                )

        except ValueError as error:
            return Response(
                {"error": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            video = VideoConversion.objects.create(
                user=(
                    request.user
                    if request.user.is_authenticated
                    else None
                ),
                original_file=video_file,
            )

            output_path = convert_video(
                video.original_file,
                output_format,
                resolution,
            )

            video.output_format = output_format
            video.resolution = resolution

            relative_path = output_path.relative_to(
                settings.MEDIA_ROOT
            )

            video.converted_file.name = str(relative_path)

            video.save()

            if not request.user.is_authenticated:
                add_anonymous_usage(
                    request,
                    video_file,
                )

            download_url = (
                settings.MEDIA_URL
                + str(relative_path)
            )

            return Response(
                {
                    "message": "Conversion successful.",
                    "download_url": download_url,
                    "output_format": output_format,
                    "resolution": resolution,
                },
                status=status.HTTP_200_OK,
            )

        except ValueError as error:
            return Response(
                {"error": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as error:
            print(error)

            return Response(
                {"error": "Video conversion failed."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class IncreaseFPSView(generics.UpdateAPIView):
    serializer_class = VideoUploadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return VideoConversion.objects.filter(
            user=self.request.user
        )

    def update(self, request, *args, **kwargs):
        video = self.get_object()

        try:
            output_path = increase_fps_video(
                video.original_file,
                video.pk,
            )

        except Exception as error:
            print(error)

            return Response(
                {"error": "FPS conversion failed."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        video.output_format = "mp4"
        video.resolution = ""

        relative_path = output_path.relative_to(
            settings.MEDIA_ROOT
        )

        video.converted_file.name = str(relative_path)

        video.save()

        return Response(
            VideoUploadSerializer(video).data,
            status=status.HTTP_200_OK,
        )



class VideoDownloadView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return VideoConversion.objects.filter(
            user=self.request.user
        )

    def get(self, request, *args, **kwargs):
        video = self.get_object()

        if not video.converted_file:
            return Response(
                {"error": "Converted video is not available."},
                status=status.HTTP_404_NOT_FOUND,
            )

        response = FileResponse(
            video.converted_file.open("rb"),
            as_attachment=True,
            filename=video.converted_file.name.split("/")[-1],
        )

        return response