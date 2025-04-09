
console.log('detail.js loaded');

const backBtn = document.getElementById('back-btn');

if (backBtn) { // Check if button exists
    backBtn.addEventListener('click', () => {
        history.back(); // Go to previous page in browser history
    });
}

// Get other needed elements
const postBox = document.getElementById('post-box');
const spinnerBox = document.getElementById('spinner-box');
const updateBtn = document.getElementById('update-btn');
const deleteBtn = document.getElementById('delete-btn');

// Construct the URL for fetching JSON data
// Takes the current page URL (e.g., /1/) and appends 'data/'
const url = window.location.href + "data/";

// Make Ajax GET request to fetch post detail data
$.ajax({
    type: 'GET',
    url: url,
    success: function(response) {
        console.log('Detail data response:', response);
        const data = response.data; // Access the data object

        if (data) { // Check if data exists
            spinnerBox.classList.add('not-visible'); // Hide spinner

            // Create elements to display title and body
            const titleEl = document.createElement('h3');
            titleEl.textContent = data.title;
            titleEl.setAttribute('class', 'mt-3'); // Add margin

            const bodyEl = document.createElement('p');
            bodyEl.textContent = data.body;
            bodyEl.setAttribute('class', 'mt-1'); // Add margin

            // Append created elements to the post box
            postBox.appendChild(titleEl);
            postBox.appendChild(bodyEl);

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
        spinnerBox.classList.add('not-visible'); // Hide spinner on error
        postBox.innerHTML = `<p class="text-danger">Error loading post details.</p>`;
    } // End error
}); // End $.ajax