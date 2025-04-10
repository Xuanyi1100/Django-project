from django import forms
from .models import Post, Comment

class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        # Specify only the fields the user should input directly
        fields = ('title', 'body')


class CommentForm(forms.ModelForm):
    body = forms.CharField(
        label='', # Don't show the default 'Body' label
        widget=forms.Textarea(attrs={
            'rows': 1, # Make textarea initially small
            'placeholder': 'Add a comment...', # Add placeholder text
            'class': 'form-control form-control-sm' # Add Bootstrap classes
            })
    )

    class Meta:
        model = Comment
        fields = ('body',) # Only include the body field in the form