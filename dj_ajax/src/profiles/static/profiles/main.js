console.log('hello my profile JS');

// --- CSRF Token Setup (copy from posts/main.js or ensure globally available) ---
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
const alertBox = document.getElementById('alert-box');
const avatarBox = document.getElementById('avatar-box');
const profileForm = document.getElementById('profile-form');
const bioInput = document.getElementById('id_bio'); // Check actual ID
const avatarInput = document.getElementById('id_avatar'); // Check actual ID

// --- Helper Functions ---
const handleAlerts = (type, msg) => {
    if (alertBox) {
        alertBox.innerHTML = `
            <div class="alert alert-${type}" role="alert">
                ${msg}
            </div>
        `;
        setTimeout(() => { alertBox.innerHTML = ""; }, 5000);
    } else { console.error("Alert box element not found!"); }
};

// --- Event Listener for Profile Form ---
if (profileForm) {
    profileForm.addEventListener('submit', e => {
        e.preventDefault(); // Prevent default page reload

        // Create FormData to handle file upload
        const formData = new FormData();
        formData.append('csrfmiddlewaretoken', csrftoken);
        formData.append('bio', bioInput.value);
        // Append the file only if one is selected
        if (avatarInput.files.length > 0) {
             formData.append('avatar', avatarInput.files[0]);
        }

        // Make Ajax POST request
        $.ajax({
            type: 'POST',
            url: '', // Submit to the same URL ('/profiles/my/')
            enctype: 'multipart/form-data', // Necessary for file uploads
            data: formData, // Send the FormData object
            processData: false, // MUST be false for FormData
            contentType: false, // MUST be false for FormData
            cache: false,       // Optional: prevent caching
            success: function(response) {
                console.log('Profile update success:', response);
                // Update avatar image display
                if (avatarBox && response.avatar) {
                    avatarBox.innerHTML = `
                        <img src="<span class="math-inline">\{response\.avatar\}" class\="rounded" height\="200px" width\="auto" alt\="</span>{response.user} avatar">
                    `;
                }
                // Update bio input value (it stays pre-filled with latest data)
                if (bioInput) {
                    bioInput.value = response.bio;
                }
                handleAlerts('success', 'Your profile has been updated!');
            },
            error: function(error) {
                console.log('Profile update error:', error);
                 // Try to parse specific form errors if server sends them
                let errorMsg = 'Oops, something went wrong.';
                if (error.responseJSON && error.responseJSON.error === 'Form invalid' && error.responseJSON.errors) {
                    try {
                        const errors = JSON.parse(error.responseJSON.errors);
                        // Simple display of first error found
                        for (const field in errors) {
                             errorMsg = `${field}: ${errors[field][0].message || errors[field][0]}`; break;
                        }
                    } catch(e) { /* Ignore parsing error */ }
                }
                handleAlerts('danger', errorMsg);
            }
        }); // End $.ajax
    }); // End submit listener
} // End if profileForm