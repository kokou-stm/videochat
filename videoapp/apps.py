from django.apps import AppConfig

def ready(self):
    import videoapp.signals


class VideoappConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'videoapp'
