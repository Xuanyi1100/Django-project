from django.urls import path
# Import the view function we just created
from .views import post_list_and_create, load_posts_data_view,like_unlike_post,post_detail,post_detail_data_view,update_post, delete_post,image_upload_view , add_comment





app_name = 'posts' # Namespace for this app's URLs

urlpatterns = [
    # When someone visits the root URL of *this app*, show the post list view
    path('', post_list_and_create, name='main-post-list'),

    path('data/<int:num_posts>/', load_posts_data_view, name='posts-data'),
    path('like-unlike/', like_unlike_post, name='like-unlike'),
    path('<int:pk>/', post_detail, name='post-detail'),
    path('<int:pk>/', post_detail, name='post-detail'), # Existing detail HTML page
    # Add path for the JSON data endpoint for a specific post
    path('<int:pk>/data/', post_detail_data_view, name='post-detail-data'),

    # Add URL for updating a specific post
    path('<int:pk>/update/', update_post, name='post-update'),
    # Add URL for deleting a specific post
    path('<int:pk>/delete/', delete_post, name='post-delete'),
    path('upload/', image_upload_view, name='image-upload'), # URL for handling uploads
    path('<int:pk>/comment/', add_comment, name='add-comment'),
]