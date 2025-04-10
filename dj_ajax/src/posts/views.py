# src/posts/views.py
from django.shortcuts import render, redirect, get_object_or_404 # Added redirect
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required # Added login_required
from .models import Post, Photo
from .forms import PostForm
from profiles.models import Profile
from .utils import action_permission # Import custom decorator

# View for main page (renders template, passes empty form for modal)
@login_required
def post_list_and_create(request):
    form = PostForm() # Empty form for modal display on GET
    if request.method == 'POST':
        # Handle Ajax POST for creating a new post
        post_form_data = PostForm(request.POST or None)
        if post_form_data.is_valid():
            if request.user.is_authenticated: # Redundant due to @login_required but safe
                try:
                    author_profile = Profile.objects.get(user=request.user)
                    instance = post_form_data.save(commit=False)
                    instance.author = author_profile
                    instance.save()
                    return JsonResponse({ # Return success JSON for Ajax
                        'id': instance.id, 'title': instance.title, 'body': instance.body,
                        'author': instance.author.user.username, 'liked': False,
                        'liked_count': 0, 'created': instance.created.strftime('%b %d, %Y %H:%M'),
                    })
                except Profile.DoesNotExist:
                    return JsonResponse({'error': 'Profile not found'}, status=404)
                except Exception as e:
                     print(f"Error saving post: {e}") # Log server error
                     return JsonResponse({'error': 'Server error during save'}, status=500)
            else: # Should not happen if @login_required works
                 return JsonResponse({'error': 'Authentication required'}, status=401)
        else: # Form invalid
            print(f"Form errors: {post_form_data.errors}") # Log form errors
            return JsonResponse({'error': 'Form invalid', 'errors': post_form_data.errors.as_json()}, status=400)
    # For GET request, render the page with the empty form
    context = {'form': form}
    return render(request, 'posts/main.html', context)

# View for rendering the detail page HTML shell
@login_required
def post_detail(request, pk):
    obj = get_object_or_404(Post, pk=pk)
    form = PostForm() # Empty form for update modal display
    context = {
        'obj': obj,
        'form': form,
    }
    return render(request, 'posts/detail.html', context)

# View for loading post batches via Ajax GET
@login_required
def load_posts_data_view(request, num_posts):
    # Note: No explicit Ajax check needed as GET is acceptable, but could add if desired
    visible_posts_per_load = 3
    upper_bound = num_posts
    lower_bound = upper_bound - visible_posts_per_load
    total_size = Post.objects.count()

    qs = Post.objects.all().order_by('-created')
    data = []
    for obj in qs:
        item = {
            'id': obj.id,
            'title': obj.title,
            'body': obj.body,
            'author': obj.author.user.username,
            'liked': True if request.user.is_authenticated and request.user in obj.liked.all() else False,
            'liked_count': obj.like_count,
            'created': obj.created.strftime('%b %d, %Y %H:%M'),
        }
        data.append(item)

    return JsonResponse({'data': data[lower_bound:upper_bound], 'size': total_size})

# View for handling like/unlike Ajax POST requests
@login_required
def like_unlike_post(request):
    if request.method == 'POST': # Only allow POST
        pk = request.POST.get('pk')
        try:
            post_obj = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return JsonResponse({'error': 'Post not found'}, status=404)

        user = request.user # Already know user is authenticated from decorator
        liked = False
        if user in post_obj.liked.all():
            post_obj.liked.remove(user)
        else:
            post_obj.liked.add(user)
            liked = True
        return JsonResponse({'liked': liked, 'count': post_obj.like_count})
    else:
        return redirect('posts:main-post-list') # Redirect if not POST

# View for handling post update Ajax POST requests
@login_required
@action_permission # Check authorship
def update_post(request, pk):
    # action_permission already got obj and verified author & pk existence
    obj = get_object_or_404(Post, pk=pk) # Still useful to have obj here
    if request.method == 'POST':
        new_title = request.POST.get('title')
        new_body = request.POST.get('body')
        obj.title = new_title
        obj.body = new_body
        obj.save()
        return JsonResponse({
            'title': obj.title,
            'body': obj.body,
        })
    else:
        return redirect('posts:main-post-list') # Redirect if not POST

def post_detail_data_view(request, pk):
    """Returns details of a single post as JSON"""
    obj = get_object_or_404(Post, pk=pk)
    data = {
        'id': obj.id,
        'title': obj.title,
        'body': obj.body,
        'author': obj.author.user.username,
        'logged_in': request.user.username, # Send username of logged-in user
        # Add other fields if needed later (like likes, created)
    }
    return JsonResponse({'data': data}) # Wrap dictionary in 'data' key for consistency

# View for handling post delete Ajax POST requests
@login_required
@action_permission # Check authorship
def delete_post(request, pk):
    # action_permission already got obj and verified author & pk existence
    obj = get_object_or_404(Post, pk=pk) # Still useful to have obj here
    if request.method == 'POST':
        obj.delete()
        return JsonResponse({'msg': 'Post deleted successfully'})
    else:
        return redirect('posts:main-post-list') # Redirect if not POST

# View for handling image uploads via Dropzone (Ajax POST)
@login_required
def image_upload_view(request):
    if request.method == 'POST':
        uploaded_image = request.FILES.get('file')
        post_pk = request.POST.get('new_post_id')
        if uploaded_image and post_pk:
            try:
                post_obj = Post.objects.get(pk=post_pk)
                # Optional: Add permission check here? Should only happen if user just created the post...
                Photo.objects.create(post=post_obj, image=uploaded_image)
                return HttpResponse() # Success
            except Post.DoesNotExist:
                return HttpResponse('Associated post not found.', status=404)
            except Exception as e:
                 print(f"Error saving photo: {e}")
                 return HttpResponse(f'Error saving file: {e}', status=500)
        else:
            return HttpResponse('Missing file or post ID.', status=400)
    else:
        return redirect('posts:main-post-list') # Redirect if not POST