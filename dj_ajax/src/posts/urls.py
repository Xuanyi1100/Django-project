from django.urls import path
# Import the view function we just created
from .views import post_list_and_create, load_posts_data_view,like_unlike_post



app_name = 'posts' # Namespace for this app's URLs

urlpatterns = [
    # When someone visits the root URL of *this app*, show the post list view
    path('', post_list_and_create, name='main-post-list'),

    path('data/<int:num_posts>/', load_posts_data_view, name='posts-data'),
    path('like-unlike/', like_unlike_post, name='like-unlike'),
]