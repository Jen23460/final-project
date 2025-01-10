// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', async () => {
    // Fetch posts when the page loads
    try {
        const response = await fetch('/posts');
        if (!response.ok) {
            throw new Error('Failed to fetch posts');
        }
        const posts = await response.json();
        const postSection = document.getElementById('postSection');

        // Ensure the post section exists
        if (postSection) {
            posts.forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.innerHTML = `<h2>${post.title}</h2><p>${post.content}</p>`;
                postSection.appendChild(postDiv);
            });
        } else {
            console.error('Element with ID "postSection" not found.');
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
    }

    function login(username, password) {
        // Simulated login - replace this with actual authentication logic
        if (username === 'user' && password === 'password') {
            localStorage.setItem('token', 'your-jwt-token'); // Store a token
            alert('Login successful!');
            // Redirect or reload the page to reflect changes
        } else {
            alert('Invalid username or password');
        }
    }
    
    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault(); // Prevent the form from submitting the traditional way

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const textResponse = await response.text(); // Read as text first
                if (response.ok) {
                    const data = JSON.parse(textResponse); // Parse JSON if valid
                    // Save the token to local storage
                    localStorage.setItem('token', data.token);
                    document.getElementById('login-message').textContent = 'Login successful! Redirecting...';
                    setTimeout(() => {
                        window.location.href = '/home.html'; // Redirect to home page after successful login
                    }, 2000);
                } else {
                    const error = JSON.parse(textResponse); // Try to parse error message
                    document.getElementById('login-message').textContent = error.message || 'Login failed. Please try again.';
                }
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('login-message').textContent = 'An error occurred. Please try again.';
            }
        });
    } else {
        console.error('Element with ID "login-form" not found.');
    }
   
    
});
