from django import forms
from .models import Post

class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        # Specify only the fields the user should input directly
        fields = ('title', 'body')