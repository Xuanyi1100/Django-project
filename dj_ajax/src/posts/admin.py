from django.contrib import admin
from .models import Post # Import the Post model from this app
from .models import Post, Photo, Comment


admin.site.register(Post) # Make Post accessible in the admin site
admin.site.register(Photo)
admin.site.register(Comment)
