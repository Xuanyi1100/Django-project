from django.db import models
from django.contrib.auth.models import User # Need the built-in User model

# Create your models here.
class Profile(models.Model):
    # Link to the built-in User model. If User is deleted, Profile is deleted.
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    # A text field for the bio, blank=True makes it optional in admin/forms.
    bio = models.TextField(blank=True)
    # Image field for avatar.
    # default='avatar.png': uses 'avatar.png' from MEDIA_ROOT if no image uploaded.
    # upload_to='avatars/': uploaded avatars go into MEDIA_ROOT/avatars/ folder.
    avatar = models.ImageField(default='avatar.png', upload_to='avatars/')
    # Timestamps
    updated = models.DateTimeField(auto_now=True) # Automatically set on save
    created = models.DateTimeField(auto_now_add=True) # Automatically set on creation

    def __str__(self):
        # How the Profile object is represented as a string (e.g., in admin)
        return f"Profile of {self.user.username}"