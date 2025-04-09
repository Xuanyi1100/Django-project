from django.contrib import admin
from .models import Post # Import the Post model from this app

# Register your models here.
admin.site.register(Post) # Make Post accessible in the admin site
