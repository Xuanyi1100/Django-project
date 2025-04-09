from django.db.models.signals import post_save # The signal sent after save()
from django.contrib.auth.models import User # The model sending the signal (sender)
from django.dispatch import receiver # The decorator to connect our function
from .models import Profile # The model we want to create

# Decorator: Connects this function to the post_save signal from the User model
@receiver(post_save, sender=User)
def post_save_create_profile(sender, instance, created, **kwargs):
    """
    Signal receiver function that creates a Profile when a new User is created.
    - sender: The model class that sent the signal (User).
    - instance: The actual instance of the sender that was saved (the specific User).
    - created: Boolean, True if a new record was created in the database.
    - **kwargs: Catches any other keyword arguments passed by the signal.
    """
    # Optional print statements (like in the transcript) for seeing the signal fire
    # print('Sender:', sender)
    # print('Instance:', instance)
    # print('Created:', created)

    if created:
        # If the 'created' flag is True, it means a new User was just created
        Profile.objects.create(user=instance)
        # print('Profile created!') # Optional confirmation print