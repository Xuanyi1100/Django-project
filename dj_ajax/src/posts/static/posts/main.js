console.log('posts main.js loaded');

// --- CSRF Token Setup ---
// Function to get CSRF token from cookies (from Django docs)
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken'); // Get the token value once

// --- DOM Element References ---
const postsBox = document.getElementById('posts-box');
const spinnerBox = document.getElementById('spinner-box');
const loadBtn = document.getElementById('load-btn');      // Load More button
const endBox = document.getElementById('end-box');        // Container for Load More button/message
const postForm = document.getElementById('post-form');    // Add Post form in modal
console.log('postForm element:', postForm); 
const titleInput = document.getElementById('id_title');   // Title input in modal form
const bodyInput = document.getElementById('id_body');     // Body input in modal form
const alertBox = document.getElementById('alert-box');    // Div for success/error messages

// --- State Variables ---
let visible = 3; // How many posts are currently visible

// --- Helper Functions ---
const handleAlerts = (type, msg) => {
    if (alertBox) { // Check if alertBox exists
        alertBox.innerHTML = `
            <div class="alert alert-${type}" role="alert">
                ${msg}
            </div>
        `;
        // Optional: Auto-hide the alert after a few seconds
        setTimeout(() => {
            alertBox.innerHTML = "";
        }, 5000); // Hide after 5 seconds
    } else {
        console.error("Alert box element not found!");
    }
};

// --- Main Function Definitions ---

// Function to fetch and display posts
const getData = () => {
    spinnerBox.classList.remove('not-visible'); // Show spinner
    loadBtn.classList.add('not-visible'); // Hide button while loading

    $.ajax({
        type: 'GET',
        url: `/data/${visible}/`, // Pass current 'visible' count
        success: function(response) {
            const data = response.data;
            const totalSize = response.size;
            spinnerBox.classList.add('not-visible'); // Hide spinner on success

            if (data.length === 0 && visible === 3) { // Handle empty case on first load
                 postsBox.innerHTML = "<p>No posts found.</p>";
                 endBox.innerHTML = ""; // No button needed
                 loadBtn.classList.add('not-visible'); // Ensure button is hidden
                 return; // Exit function early
            }

            // Append new posts fetched
            data.forEach(el => {
                postsBox.innerHTML += `
                    <div class="card mb-2">
                        <div class="card-body">
                            <h5 class="card-title">${el.title}</h5>
                            <p class="card-text">${el.body}</p>
                        </div>
                        <div class="card-footer">
                            <div class="row">
                                <div class="col-auto me-auto">
                                    <small class="text-muted">Author: ${el.author} | Created: ${el.created}</small>
                                </div>
                                <div class="col-auto">
                                    
                                    <a href="/${el.id}/" class="btn btn-primary btn-sm">Details</a> 
                                </div>
                                <div class="col-auto">
                                    <form class="like-unlike-forms" data-form-id="${el.id}">
                                        <button class="btn btn-danger btn-sm" id="like-unlike-${el.id}">
                                            ${el.liked ? 'Unlike' : 'Like'} (${el.liked_count})
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }); // End data.forEach

            likeUnlikePosts(); // *** Attach listeners to new like buttons ***

            // Handle Load More button/message visibility
            if (visible >= totalSize) {
                console.log('No more posts to load');
                loadBtn.classList.add('not-visible'); // Keep button hidden
                endBox.innerHTML = "<p>No more posts to load...</p>"; // Show end message
            } else {
                loadBtn.classList.remove('not-visible'); // Show button if more posts exist
                // Ensure endBox only contains the button
                 const endBoxP = endBox.querySelector('p');
                 if (endBoxP) { endBoxP.remove(); }
                 if (!endBox.contains(loadBtn)) { endBox.appendChild(loadBtn); }
            }
        }, // End success
        error: function(error) {
            console.log('AJAX Error loading posts:', error);
            spinnerBox.classList.add('not-visible');
            loadBtn.classList.add('not-visible');
            endBox.innerHTML = `<p class="text-danger">Error loading posts.</p>`;
            handleAlerts('danger', 'Error loading posts.'); // Show alert on error
        } // End error
    }); // End $.ajax
}; // End getData function

// Function to set up event listeners for like/unlike forms
const likeUnlikePosts = () => {
    const likeUnlikeForms = document.querySelectorAll('.like-unlike-forms');
    likeUnlikeForms.forEach(form => {
        if (!form.dataset.listenerAttached) { // Prevent adding multiple listeners
            form.addEventListener('submit', e => {
                e.preventDefault(); // Stop default form submission
                const clickedId = e.target.getAttribute('data-form-id'); // Get post ID from form attribute
                const clickedBtn = document.getElementById(`like-unlike-${clickedId}`); // Get button by unique ID

                $.ajax({
                    type: 'POST',
                    url: '/like-unlike/', // URL to the Django like/unlike view
                    data: {
                        'csrfmiddlewaretoken': csrftoken, // Use the cookie-based token
                        'pk': clickedId // Send post primary key
                    },
                    success: function(response) {
                        // Update the button text and count based on response
                        clickedBtn.textContent = `${response.liked ? 'Unlike' : 'Like'} (${response.count})`;
                    },
                    error: function(error) {
                        console.log('Like/Unlike Error:', error);
                        handleAlerts('danger', 'Like/Unlike failed.'); // Show alert on error
                    }
                }); // End ajax call
            }); // End event listener
            form.dataset.listenerAttached = 'true'; // Mark form as having a listener attached
        }
    }); // End forEach form
}; // End likeUnlikePosts function

// --- Event Listeners ---

// Listener for the Load More button
loadBtn.addEventListener('click', () => {
    visible += 3; // Increase the number of posts to display
    getData();    // Fetch the next batch
});

// Listener for the Add Post form submission
postForm.addEventListener('submit', e => {
    console.log('Submit event triggered!');
    e.preventDefault(); // Prevent default page reload

    $.ajax({
        type: 'POST',
        url: '', // Submit POST to the same URL ('/')
        data: {
            'csrfmiddlewaretoken': csrftoken, // Use cookie-based token
            'title': titleInput.value,
            'body': bodyInput.value
        },
        success: function(response) {
            console.log('Form Submit Success:', response);
            // 1. Construct HTML for the new post card
            const newPostHtml = `
                <div class="card mb-2">
                    <div class="card-body">
                        <h5 class="card-title">${response.title}</h5>
                        <p class="card-text">${response.body}</p>
                    </div>
                    <div class="card-footer">
                        <div class="row">
                            <div class="col-auto me-auto">
                                <small class="text-muted">Author: ${response.author} | Created: ${response.created}</small>
                            </div>
                            <div class="col-auto">
                                <a href="#" class="btn btn-primary btn-sm">Details</a>
                            </div>
                            <div class="col-auto">
                                <form class="like-unlike-forms" data-form-id="${response.id}">
                                    <button class="btn btn-danger btn-sm" id="like-unlike-${response.id}">
                                        ${response.liked ? 'Unlike' : 'Like'} (${response.liked_count})
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            // 2. Prepend the new post HTML
            postsBox.insertAdjacentHTML('afterbegin', newPostHtml);
            // 3. Re-attach listener to the NEW like button
            likeUnlikePosts();
            // 4. Hide the modal
            $('#addPostModal').modal('hide'); // Using jQuery per transcript for modal hide
            // 5. Show success alert
            handleAlerts('success', 'New post added!');
            // 6. Reset the form
            postForm.reset();
        },
        error: function(error) {
            console.log('Form Submit Error:', error);
            handleAlerts('danger', 'Oops, something went wrong submitting the post.');
        }
    }); // End $.ajax
}); // End submit event listener

// --- Initial Data Load ---
getData(); // Call getData once when the page loads to get initial posts