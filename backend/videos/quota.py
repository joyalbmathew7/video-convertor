MAX_ANONYMOUS_FILE_SIZE = 1 * 1024 * 1024 * 1024
MAX_AUTHENTICATED_FILE_SIZE = 2 * 1024 * 1024 * 1024

ANONYMOUS_TOTAL_LIMIT = 1 * 1024 * 1024 * 1024
AUTHENTICATED_TOTAL_LIMIT = 10 * 1024 * 1024 * 1024


def check_file_size(file, max_size):
    if file.size > max_size:
        raise ValueError(
            "This video is larger than the allowed file size."
        )


def get_authenticated_usage(user):
    from .models import VideoConversion

    conversions = VideoConversion.objects.filter(
        user=user
    )

    return sum(
        conversion.original_file.size
        for conversion in conversions
        if conversion.original_file
    )


def check_authenticated_quota(user, file):
    check_file_size(
        file,
        MAX_AUTHENTICATED_FILE_SIZE,
    )

    current_usage = get_authenticated_usage(user)

    if current_usage + file.size > AUTHENTICATED_TOTAL_LIMIT:
        raise ValueError(
            "You have reached the 10 GB total upload limit."
        )


def get_anonymous_usage(request):
    return request.session.get(
        "anonymous_video_usage",
        0,
    )


def check_anonymous_quota(request, file):
    check_file_size(
        file,
        MAX_ANONYMOUS_FILE_SIZE,
    )

    current_usage = get_anonymous_usage(request)

    if current_usage + file.size > ANONYMOUS_TOTAL_LIMIT:
        raise ValueError(
            "You have reached the 1 GB total upload limit. "
            "Please log in for a 10 GB limit."
        )


def add_anonymous_usage(request, file):
    current_usage = get_anonymous_usage(request)

    request.session["anonymous_video_usage"] = (
        current_usage + file.size
    )

    request.session.modified = True