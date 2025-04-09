from django.db import models
from django.contrib.auth.models import User # Needed for the 'liked' field
from profiles.models import Profile # Need to import Profile from the other app

# Create your models here.
class Post(models.Model):
    title = models.CharField(max_length=200) # Simple text field with max length
    body = models.TextField() # Longer text field
    # ManyToMany with User: tracks likes. blank=True allows posts with 0 likes.
    liked = models.ManyToManyField(User, blank=True)
    # ForeignKey to Profile: links post to its author. If Profile deleted, Post deleted.
    author = models.ForeignKey(Profile, on_delete=models.CASCADE)
    # Timestamps
    updated = models.DateTimeField(auto_now=True)
    created = models.DateTimeField(auto_now_add=True)

    

    def __str__(self):
        # String representation of a Post object
        return str(self.title)
    @property
    def like_count(self):
        # Returns the number of users who liked this post instance
        return self.liked.count()
    
    class Meta:
        ordering = ('-created',) # Note the comma to make it a tuple
