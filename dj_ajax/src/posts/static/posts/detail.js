console.log('detail.js loaded');

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
const postBox = document.getElementById('post-box');
const spinnerBox = document.getElementById('spinner-box');
const backBtn = document.getElementById('back-btn');
const updateBtn = document.getElementById('update-btn');
const deleteBtn = document.getElementById('delete-btn');
const alertBox = document.getElementById('alert-box'); // Assumes alert-box exists in base.html or detail.html content block top level
const updateForm = document.getElementById('update-form');
const deleteForm = document.getElementById('delete-form');

// Get Update Form Inputs (needed for pre-fill and potentially reading values on submit)
const titleUpdateInput = document.getElementById('id_title'); // Check actual ID if not default
const bodyUpdateInput = document.getElementById('id_body');   // Check actual ID if not default

// Construct URLs based on current page URL (e.g., /<pk>/)
const currentUrl = window.location.href;
const updateUrl = currentUrl + "update/";
const deleteUrl = currentUrl + "delete/";
const dataUrl = currentUrl + "data/"; // URL to fetch post JSON data

const commentForm = document.getElementById('comment-form');
// Use the correct ID including the prefix ('comment') Django generates
const commentBodyInput = document.getElementById('id_comment-body');
const commentsBox = document.getElementById('comments-box');
// Get post PK from the current page's URL (e.g., /19/ -> 19)
const postPk = window.location.pathname.split('/')[1];

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
        console.error("Alert box element not found!");
    }
};

// --- Initial Data Load & Display ---
$.ajax({
    type: 'GET',
    url: dataUrl, // Fetch the specific post's data
    success: function(response) {
        console.log('Detail data response:', response);
        const data = response.data;

        if (data) {
            spinnerBox.classList.add('not-visible'); // Hide spinner

            // Create and display title and body
            const titleEl = document.createElement('h3');
            titleEl.textContent = data.title;
            titleEl.setAttribute('class', 'mt-3');
            titleEl.setAttribute('id', 'title-display'); // Add ID for later update

            const bodyEl = document.createElement('p');
            bodyEl.textContent = data.body;
            bodyEl.setAttribute('class', 'mt-1');
            bodyEl.setAttribute('id', 'body-display'); // Add ID for later update

            postBox.appendChild(titleEl);
            postBox.appendChild(bodyEl);

            // Pre-fill update form
            if (titleUpdateInput) titleUpdateInput.value = data.title;
            if (bodyUpdateInput) bodyUpdateInput.value = data.body;

            // Show Update/Delete buttons ONLY if logged-in user is the author
            if (data.author === data.logged_in) {
                console.log('Author matches logged in user - showing buttons');
                updateBtn.classList.remove('not-visible');
                deleteBtn.classList.remove('not-visible');
            } else {
                 console.log('Author does not match logged in user');
            }
        } else {
             console.error("No data received in response");
             spinnerBox.classList.add('not-visible');
             postBox.innerHTML = "<p>Could not load post details.</p>";
        }
    }, // End success
    error: function(error) {
        console.log('Error fetching detail data:', error);
        spinnerBox.classList.add('not-visible');
        postBox.innerHTML = `<p class="text-danger">Error loading post details.</p>`;
        handleAlerts('danger', 'Error loading details.');
    } // End error
}); // End initial $.ajax GET call

// --- Event Listeners ---

// Back Button
if (backBtn) {
    backBtn.addEventListener('click', () => {
        history.back();
    });
}

// Update Form Submission
if (updateForm) {
    updateForm.addEventListener('submit', e => {
        e.preventDefault();
        const titleVal = titleUpdateInput?.value; // Use optional chaining just in case
        const bodyVal = bodyUpdateInput?.value;

        $.ajax({
            type: 'POST',
            url: updateUrl,
            data: {
                'csrfmiddlewaretoken': csrftoken,
                'title': titleVal,
                'body': bodyVal
            },
            success: function(response) {
                console.log('Update Success:', response);
                // Update displayed title and body
                const titleDisp = document.getElementById('title-display');
                const bodyDisp = document.getElementById('body-display');
                if (titleDisp) titleDisp.textContent = response.title;
                if (bodyDisp) bodyDisp.textContent = response.body;

                $('#updateModal').modal('hide'); // Hide modal using jQuery
                handleAlerts('success', 'Post updated!');
            },
            error: function(error) {
                console.log('Update Error:', error);
                handleAlerts('danger', 'Oops, update failed.');
            }
        }); // End $.ajax
    }); // End submit listener
} // End if updateForm

// Delete Form Submission
if (deleteForm) {
    deleteForm.addEventListener('submit', e => {
        e.preventDefault();
        const postTitle = document.getElementById('title-display')?.textContent || 'this post';

        $.ajax({
            type: 'POST',
            url: deleteUrl,
            data: {
                'csrfmiddlewaretoken': csrftoken,
            },
            success: function(response) {
                console.log('Delete Success:', response);
                localStorage.setItem('deletedTitle', postTitle); // Store title for alert on main page
                window.location.href = window.location.origin; // Redirect to homepage
            },
            error: function(error) {
                console.log('Delete Error:', error);
                handleAlerts('danger', 'Oops, delete failed.');
            }
        }); // End $.ajax
    }); // End submit listener
} // End if deleteForm

// Listener for the Add Comment form submission
if (commentForm) {
    commentForm.addEventListener('submit', e => {
        e.preventDefault(); // Prevent default page reload

        // Construct the specific URL for adding a comment to this post
        const commentUrl = `/${postPk}/comment/`; // Uses postPk obtained from window.location

        $.ajax({
            type: 'POST',
            url: commentUrl,
            data: {
                'csrfmiddlewaretoken': csrftoken,
                'comment-body': commentBodyInput.value, // Adjust according to the input name
            },
            success: function(response) {
                console.log('Comment add success:', response);

                // Remove "No comments yet..." message if it exists
                const noCommentsEl = commentsBox.querySelector('p');
                if (noCommentsEl && noCommentsEl.textContent === 'No comments yet...') {
                    noCommentsEl.remove();
                }

                // Also remove initial hr if needed, or add one before first comment
                const firstHr = commentsBox.querySelector('hr');
                if (commentsBox.querySelectorAll('.card').length === 0 && firstHr) {
                    commentsBox.insertAdjacentHTML('afterbegin', '<hr>');
                }

                // Construct HTML for the new comment using response data
                const newCommentHtml = `
                    <div class="card card-body shadow-sm mb-2">
                        <p class="mb-1">
                            <strong>${response.user}</strong>
                            <small class="text-muted"> just now</small>
                        </p>
                        <p class="mb-0">${response.body.replace(/\n/g, "<br>")}</p>
                    </div>
                `;

                // Prepend to comments box
                const targetElement = commentsBox.querySelector('hr') || commentsBox;
                targetElement.insertAdjacentHTML('afterend', newCommentHtml);

                // Reset the comment form
                commentForm.reset();

                // Show success alert
                handleAlerts('success', 'Comment added!');

                // Update comment count badge
                const countBadge = document.querySelector('#comments-box h5 .badge');
                if (countBadge) {
                    countBadge.textContent = parseInt(countBadge.textContent) + 1;
                }
            },
            error: function(error) {
                console.log('Comment add error:', error);
                let errorMsg = 'Failed to add comment.';
                if (error.responseJSON && error.responseJSON.error === 'Comment invalid' && error.responseJSON.errors) {
                    console.log("Validation Errors:", error.responseJSON.errors);
                    try {
                        const errors = JSON.parse(error.responseJSON.errors);
                        errorMsg = errors.body[0].message || 'Invalid input.';
                    } catch (e) {}
                }
                handleAlerts('danger', errorMsg);
            }
        });
    });
}
