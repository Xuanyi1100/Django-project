
from django.apps import AppConfig

class ProfilesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'profiles'

    # Override the ready() method
    def ready(self):
        # Import the signals module ONLY when the app is ready
        # This ensures the signal receivers are connected.
        import profiles.signals