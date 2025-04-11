console.log('posts main.js loaded');

// --- CSRF Token Setup ---
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');

// --- DOM Element References ---
const postsBox = document.getElementById('posts-box');
const spinnerBox = document.getElementById('spinner-box');
const loadBtn = document.getElementById('load-btn');
const endBox = document.getElementById('end-box');
const postForm = document.getElementById('post-form');
const titleInput = document.getElementById('id_title'); // Check ID in Inspect Element if crispy changes it
const bodyInput = document.getElementById('id_body');   // Check ID in Inspect Element
const alertBox = document.getElementById('alert-box');
const dropzoneForm = document.getElementById('my-dropzone'); // The Dropzone form element
const addBtn = document.getElementById('add-btn');         // The '+ Add' button inside the modal
const closeBtns = document.querySelectorAll('.add-modal-close'); // Class for BOTH modal close buttons ('X' and 'Close')

// --- State Variables ---
let visible = 3; // How many posts are currently visible/loaded
let newPostId = null; // To store the ID of the newly created post for Dropzone
let myDropzone = null; // To store the Dropzone instance

// --- Helper Functions ---
const handleAlerts = (type, msg) => {
    if (alertBox) {
        alertBox.innerHTML = `
            <div class="alert alert-${type}" role="alert">
                ${msg}
            </div>
        `;
        setTimeout(() => { alertBox.innerHTML = ""; }, 5000);
    } else {
        console.error("Alert box element (#alert-box) not found!");
    }
};

// --- Main Function Definitions ---

// Function to fetch and display post batches
const getData = () => {
    spinnerBox.classList.remove('not-visible');
    if(loadBtn) loadBtn.classList.add('not-visible'); // Hide button only if it exists

    $.ajax({
        type: 'GET',
        url: `/data/${visible}/`,
        success: function(response) {
            const data = response.data;
            const totalSize = response.size;
            spinnerBox.classList.add('not-visible');

            if (data.length === 0 && visible === 3) {
                 if(postsBox) postsBox.innerHTML = "<p>No posts found.</p>";
                 if(endBox) endBox.innerHTML = "";
                 if(loadBtn) loadBtn.classList.add('not-visible');
                 return;
            }

            data.forEach(el => {
                if(postsBox){ // Check if postsBox exists
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
                } // end if postsBox
            }); // End data.forEach

            likeUnlikePosts(); // Attach listeners to like buttons (including new ones)

            // Handle Load More button/message visibility
            if (endBox && loadBtn) { // Check if elements exist
                if (visible >= totalSize) {
                    loadBtn.classList.add('not-visible');
                    endBox.innerHTML = "<p>No more posts to load...</p>";
                } else {
                    loadBtn.classList.remove('not-visible');
                    const endBoxP = endBox.querySelector('p');
                    if (endBoxP) { endBoxP.remove(); }
                    if (!endBox.contains(loadBtn)) { endBox.appendChild(loadBtn); }
                }
            } // end if endBox && loadBtn
        }, // End success
        error: function(error) {
            console.log('AJAX Error loading posts:', error);
            spinnerBox.classList.add('not-visible');
            if(loadBtn) loadBtn.classList.add('not-visible');
            if(endBox) endBox.innerHTML = `<p class="text-danger">Error loading posts.</p>`;
            handleAlerts('danger', 'Error loading posts.');
        } // End error
    }); // End $.ajax
}; // End getData function

// Function to set up event listeners for like/unlike forms
const likeUnlikePosts = () => {
    const likeUnlikeForms = document.querySelectorAll('.like-unlike-forms');
    likeUnlikeForms.forEach(form => {
        if (!form.dataset.listenerAttached) {
            form.addEventListener('submit', e => {
                e.preventDefault();
                const clickedId = form.getAttribute('data-form-id'); // Get ID from form itself
                const clickedBtn = document.getElementById(`like-unlike-${clickedId}`);

                $.ajax({
                    type: 'POST',
                    url: '/like-unlike/',
                    data: {
                        'csrfmiddlewaretoken': csrftoken,
                        'pk': clickedId
                    },
                    success: function(response) {
                        clickedBtn.textContent = `${response.liked ? 'Unlike' : 'Like'} (${response.count})`;
                    },
                    error: function(error) {
                        console.log('Like/Unlike Error:', error);
                        handleAlerts('danger', 'Like/Unlike failed.');
                    }
                }); // End ajax call
            }); // End event listener
            form.dataset.listenerAttached = 'true';
        }
    }); // End forEach form
}; // End likeUnlikePosts function

// --- Event Listeners ---

// Listener for the Load More button
if (loadBtn) { // Check if button exists
    loadBtn.addEventListener('click', () => {
        visible += 3;
        getData();
    });
}

// Listener for the Add Post form submission
if (postForm) { // Check if form exists
    postForm.addEventListener('submit', e => {
        e.preventDefault();

        $.ajax({
            type: 'POST',
            url: '', // Submit to the current page URL
            data: {
                'csrfmiddlewaretoken': csrftoken,
                'title': titleInput.value,
                'body': bodyInput.value
            },
            success: function(response) {
                console.log('Form Submit Success:', response);

                newPostId = response.id; // Assign ID
                console.log("Assigned newPostId:", newPostId); //

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
                                    <a href="/${response.id}/" class="btn btn-primary btn-sm">Details</a>
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
                postsBox.insertAdjacentHTML('afterbegin', newPostHtml);
                likeUnlikePosts(); // Re-attach listener to the NEW like button

                handleAlerts('success', 'New post added! Add photos below.');
                


                 //Show the dropzone
                if (dropzoneForm) {
                    dropzoneForm.classList.remove('not-visible');
                }
                 
            },
            error: function(error) {
                console.log('Form Submit Error:', error);
                handleAlerts('danger', 'Oops, something went wrong submitting the post.');
                 // Optionally inspect error.responseJSON if server returns specific validation errors
                 if (error.responseJSON && error.responseJSON.errors) {
                     console.log("Validation Errors:", error.responseJSON.errors);
                     // Potentially display these errors to the user
                 }
            }
        }); // End $.ajax
    }); // End submit event listener
} // End if postForm

// Listener for the Modal Close Buttons (both 'X' and 'Close')
if (closeBtns) {
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (postForm) postForm.reset(); // Reset the Add Post form
            if (dropzoneForm && !dropzoneForm.classList.contains('not-visible')) {
                 dropzoneForm.classList.add('not-visible'); // Hide dropzone
                 if (myDropzone) {
                     myDropzone.removeAllFiles(true); // Clear files from Dropzone UI
                 }
            }
            newPostId = null; // Reset the stored post ID
            alertBox.innerHTML = ""; // Clear alerts immediately on close
        });
    });
}

// --- Dropzone Configuration ---
Dropzone.autoDiscover = false; // Prevent auto-discovery

if (dropzoneForm) { // Check if the dropzone element exists
     myDropzone = new Dropzone("#my-dropzone", { // Use the CSS selector for the form
        url: "/upload/", // Server endpoint
        paramName: "file", // Name expected by request.FILES.get('file')
        maxFiles: 5,
        maxFilesize: 4, // MB
        acceptedFiles: ".png,.jpg,.jpeg",
        autoProcessQueue: true, // Upload immediately

        init: function() {
            // 'this' refers to the Dropzone instance
            this.on("sending", function(file, xhr, formData) {
                // Append CSRF token and the captured Post ID
                console.log('Dropzone sending file with post ID:', newPostId);
                console.log("Value of newPostId when sending:", newPostId);
                formData.append("csrfmiddlewaretoken", csrftoken);
                formData.append("new_post_id", newPostId); // Send the captured ID
            });
            this.on("success", function(file, response) {
                console.log("Upload successful:", file.name);
                handleAlerts('success', `'${file.name}' uploaded successfully.`);
                 // Optional: Remove file preview after short delay
                 // const self = this; setTimeout(() => { self.removeFile(file); }, 2000);
            });
            this.on("error", function(file, message) {
                console.log("Upload error:", message);
                 let errorMsg = (typeof message === 'object' && message.error) ? message.error : message;
                handleAlerts('danger', `Error uploading ${file.name}: ${errorMsg}`);
                // Optional: Remove the errored file preview
                // this.removeFile(file);
            });
        } // End init
    }); // End new Dropzone
} // End if dropzoneForm exists

// --- Initial Data Load ---
getData(); // Call once when page loads