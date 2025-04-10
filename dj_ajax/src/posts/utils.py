# src/posts/utils.py
from django.shortcuts import redirect # Import redirect
from .models import Post
# Note: Profile model is not strictly needed here if comparing request.user directly

def action_permission(func):
    """
    Decorator to check if the requesting user is the author of the post
    identified by 'pk' in the URL kwargs.
    Assumes the user is already authenticated (use @login_required first).
    Redirects to the main post list if permission denied or post not found.
    """
    def wrapper(request, *args, **kwargs):
        pk = kwargs.get('pk') # Get the primary key from URL arguments
        if pk:
            try:
                post = Post.objects.get(pk=pk)
                # Direct comparison is usually sufficient if @login_required is used first
                if request.user == post.author.user:
                    # If user matches the post's author's user, execute the view
                    return func(request, *args, **kwargs)
                else:
                    # If not the author, redirect
                    print(f"Permission Denied: User {request.user} is not author {post.author.user}") # Optional log
                    return redirect('posts:main-post-list') # Use named URL for main list
            except Post.DoesNotExist:
                # Post not found, redirect
                print(f"Permission Check Failed: Post PK={pk} not found.") # Optional log
                return redirect('posts:main-post-list')
            # Optional: Handle Profile.DoesNotExist if strictly needed, though less likely now
        else:
             # Decorator applied to a view without 'pk'? Redirect.
             print("Permission Check Failed: Missing PK.") # Optional log
             return redirect('posts:main-post-list')
    return wrapper