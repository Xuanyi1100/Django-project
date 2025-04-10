# src/profiles/forms.py
from django import forms
from .models import Profile

class ProfileForm(forms.ModelForm):
    class Meta:
        model = Profile
        # Only allow updating bio and avatar via this form
        fields = ('bio', 'avatar')