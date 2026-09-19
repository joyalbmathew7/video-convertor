from django.urls import path


from .views import (
    VideoUploadView,
    VideoConvertView,
    IncreaseFPSView,
    PublicResolutionConvertView,
    VideoDownloadView,
)

urlpatterns = [
    path(
        "public/convert/",
        PublicResolutionConvertView.as_view(),
        name="public-convert",
    ),

    path(
        "upload/",
        VideoUploadView.as_view(),
        name="video-upload",
    ),

    path(
        "<int:pk>/convert/",
        VideoConvertView.as_view(),
        name="video-convert",
    ),

    path(
        "<int:pk>/increase-fps/",
        IncreaseFPSView.as_view(),
        name="increase-fps",
    ),
    path(
    "<int:pk>/download/",
    VideoDownloadView.as_view(),
    name="video-download",
),
]