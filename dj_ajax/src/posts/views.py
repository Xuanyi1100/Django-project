from django.shortcuts import render

from .models import Post # Import your Post model
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from .forms import PostForm # Import the form
from profiles.models import Profile # Import Profile to find the author


def post_list_and_create(request):
    form = PostForm() # For initial GET request context
    if request.method == 'POST':
        # If POST, bind data to a new form instance
        post_form_data = PostForm(request.POST or None)
        if post_form_data.is_valid():
            if request.user.is_authenticated:
                try:
                    author_profile = Profile.objects.get(user=request.user)
                    instance = post_form_data.save(commit=False)
                    instance.author = author_profile
                    instance.save()
                    # *** RETURN JSON RESPONSE FOR NEW POST ***
                    return JsonResponse({
                        #'status': 'success', # Optional status key
                        'id': instance.id,
                        'title': instance.title,
                        'body': instance.body,
                        'author': instance.author.user.username,
                        'liked': False, # New post starts with liked=False
                        'liked_count': 0, # New post starts with 0 likes
                        'created': instance.created.strftime('%b %d, %Y %H:%M'),
                    }) # Return data of the new post
                except Profile.DoesNotExist:
                    return JsonResponse({'error': 'Profile not found'}, status=404)
                except Exception as e:
                     print(f"Error saving post: {e}") # Log for debugging
                     return JsonResponse({'error': 'Server error during save'}, status=500)
            else: # User not authenticated
                 return JsonResponse({'error': 'Authentication required'}, status=401)
        else: # Form validation failed
            print(f"Form errors: {post_form_data.errors}") # Log for debugging
            return JsonResponse({'error': 'Form invalid', 'errors': post_form_data.errors.as_json()}, status=400)
    # For GET request
    context = {'form': form}
    return render(request, 'posts/main.html', context)


def load_posts_data_view(request, num_posts): # Accept num_posts from URL
    visible_posts_per_load = 3 # How many new posts to load each time
    upper_bound = num_posts
    lower_bound = upper_bound - visible_posts_per_load
    total_size = Post.objects.count() # Get total number of posts

    # Order posts, newest first is common (optional)
    qs = Post.objects.all().order_by('-created')
    data = []
    for obj in qs:
        item = {
            'id': obj.id,
            'title': obj.title,
            'body': obj.body,
            'author': obj.author.user.username,
            # Check if the requesting user (if logged in) liked this post
            'liked': True if request.user.is_authenticated and request.user in obj.liked.all() else False,
            'liked_count': obj.like_count, # Use the new property
            'created': obj.created.strftime('%b %d, %Y %H:%M'), # Nicer date format
        }
        data.append(item)

    # Return the sliced data and the total size
    return JsonResponse({'data': data[lower_bound:upper_bound], 'size': total_size})


def like_unlike_post(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    if request.method == 'POST':
        pk = request.POST.get('pk') # Get post ID from Ajax data
        try:
            post_obj = Post.objects.get(pk=pk) # Find the post
        except Post.DoesNotExist:
            return JsonResponse({'error': 'Post not found'}, status=404)

        user = request.user
        liked = False # Default assumption

        if user in post_obj.liked.all():
            # User already liked it -> Unlike
            post_obj.liked.remove(user)
            # liked remains False
        else:
            # User hasn't liked it -> Like
            post_obj.liked.add(user)
            liked = True

        # Return the new state and count
        return JsonResponse({'liked': liked, 'count': post_obj.like_count})

    return JsonResponse({'error': 'Invalid request method'}, status=400)