
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from .models import Profile
from .forms import ProfileForm
from django.contrib.auth.decorators import login_required # Ensure user is logged in


@login_required # Decorator to require login for this view
def my_profile_view(request):
    # Get the profile object for the currently logged-in user
    profile_obj = get_object_or_404(Profile, user=request.user)

    # Handle POST request (Ajax form submission)
    if request.method == 'POST':
        # Pass instance to update the existing profile, include POST data and FILES
        form = ProfileForm(request.POST, request.FILES, instance=profile_obj)
        if form.is_valid():
            instance = form.save()
            # Return data needed to update the frontend
            return JsonResponse({
                'bio': instance.bio,
                'avatar': instance.avatar.url, # Get URL of the potentially new avatar
                'user': instance.user.username # Send username for confirmation/display
            })
        else:
            # Handle invalid form submission (e.g., validation errors)
            # In a real app, you might return form.errors.as_json()
            return JsonResponse({'error': 'Form invalid', 'errors': form.errors.as_json()}, status=400)

    # Handle GET request (initial page load)
    else:
        # Create form instance pre-filled with the user's current profile data
        form = ProfileForm(instance=profile_obj)

    # Prepare context for rendering the template
    context = {
        'obj': profile_obj, # Pass the profile object (for displaying username/avatar)
        'form': form,       # Pass the form instance (for rendering and pre-filling)
    }
    return render(request, 'profiles/main.html', context)