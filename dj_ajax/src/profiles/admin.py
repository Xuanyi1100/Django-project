
from django.contrib import admin
from .models import Profile # Import the Profile model from this app


admin.site.register(Profile) # Make Profile accessible in the admin site