//  Fetch User Files - Moved Above Usage
async function fetchUserFiles() {
    try {
        const fileList = document.getElementById("fileList");
        const sidebarFiles = document.getElementById("sidebarFiles");

        if (!fileList || !sidebarFiles) return; // Prevent errors if elements are missing

        fileList.innerHTML = "<li>Loading files...</li>";
        sidebarFiles.innerHTML = "<li>Loading files...</li>";

        const token = localStorage.getItem("token");
        if (!token) {
            alert("⚠️ You need to log in.");
            logout();
            return;
        }

        const response = await fetch("/my-files", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 403) {
            alert("⚠️ Session expired. Please log in again.");
            logout();
            return;
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
            console.error("Unexpected response format:", data);
            fileList.innerHTML = "<li>❌ Error fetching files</li>";
            sidebarFiles.innerHTML = "<li>❌ Error fetching files</li>";
            return;
        }

        fileList.innerHTML =
            data.length === 0
                ? "<li>📁 No files uploaded yet.</li>"
                : data
                      .map(
                          (file) => `
                <li>
                    ${file.filename} 
                    - <button onclick="deleteFile('${file._id}')">🗑 Delete</button>
                </li>`
                      )
                      .join("");

        updateSidebarFiles(data);
    } catch (error) {
        console.error("❌ Fetching Files Error:", error);
        document.getElementById("fileList").innerHTML = "<li>❌ Failed to load files</li>";
        document.getElementById("sidebarFiles").innerHTML = "<li>❌ Failed to load files</li>";
    }
}

//  Update Sidebar with Uploaded Files
function updateSidebarFiles(files) {
    let sidebarFiles = document.getElementById("sidebarFiles");
    if (!sidebarFiles) return;

    sidebarFiles.innerHTML = "<h3>Uploaded Files</h3><ul>";
    sidebarFiles.innerHTML +=
        files.length === 0
            ? "<li>📁 No files uploaded yet.</li>"
            : files
                  .map(
                      (file) =>
                          `<li>${file.filename} - <a href="/download/${file._id}">📥 Download</a></li>`
                  )
                  .join("");
    sidebarFiles.innerHTML += "</ul>";
}

//  Upload File & Refresh Sidebar
document.getElementById("uploadForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const fileInput = document.getElementById("fileInput").files[0];
    if (!fileInput) {
        alert("❌ Please select a file to upload.");
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        alert("⚠️ You need to log in.");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput);

    try {
        const response = await fetch("/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });

        const result = await handleResponse(response);
        document.getElementById("uploadMessage").innerText = result.message;
        fetchUserFiles(); // ✅ Refresh uploaded files list everywhere
    } catch (error) {
        console.error("❌ Upload Error:", error);
        document.getElementById("uploadMessage").innerText = "❌ Upload failed.";
    }
});

//  Auto-fetch files on page load
document.addEventListener("DOMContentLoaded", fetchUserFiles);

//  Delete File Function
async function deleteFile(fileId) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("⚠️ Session expired. Please log in again.");
        logout();
        return;
    }

    try {
        const response = await fetch(`/delete/${fileId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error(`❌ Server responded with ${response.status}`);

        fetchUserFiles(); // Refresh file list
    } catch (error) {
        console.error("❌ Delete Error:", error);
    }
}

//  Handle API Responses
async function handleResponse(response) {
    if (response.status === 403) {
        alert("⚠️ Session expired. Please log in again.");
        logout();
        return;
    }

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`❌ Server Error: ${response.status} - ${errorText}`);
    }

    return await response.json();
}

//  Navigation Function
function navigateTo(page) {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) {
        console.error("❌ Error: #main-content not found!");
        return;
    }

    document.getElementById("upload").style.display = "none";
    let content = "";

    switch (page) {
        case "/userToUser":
            content = `
                <h2>User to User Sharing</h2>
                <p>Securely share files with a specific user.</p>
                <select id="fileIdInput"></select> <!-- File selection dropdown -->
                <input type="text" id="recipientUserId" placeholder="Enter recipient User ID" required>
                <button onclick="shareFileWithUser()">Share File</button>
                <p id="shareStatus"></p>
            `;
            mainContent.innerHTML = content;
            loadFileSelection(); // Load user's uploaded files
            break;
        
        case "/oneTimeLink":
            content = `
                <h2>Generate One-Time Link</h2>
                <p>Select a file, set a password, and generate a secure one-time download link.</p>
                <select id="fileIdInput"></select>
                <input type="password" id="passwordInput" placeholder="Set a Password" required>
                <button onclick="generateOneTimeLink()">Generate Link</button>
                <p id="generatedLink"></p>
            `;
            mainContent.innerHTML = content;
            loadFileSelection();
            break;
        
        case "/steganography":
            content = "<h2>Steganography</h2><p>Embed files inside images for hidden transmission.</p>";
            mainContent.innerHTML = content;
            break;
        
        default:
            mainContent.innerHTML = "<h2>Page Not Found</h2><p>The requested page does not exist.</p>";
    }
}



//  Load File Selection in One-Time Link Page


async function loadFileSelection() {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("⚠️ You need to log in.");
            return;
        }

        const response = await fetch("/my-files", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const files = await response.json();
        const fileDropdown = document.getElementById("fileIdInput");
        
        if (!fileDropdown) {
            console.error("File dropdown element not found");
            return;
        }

        if (!Array.isArray(files)) {
            console.error("Unexpected response format:", files);
            return;
        }

        fileDropdown.innerHTML = files.length === 0
            ? "<option value=''>No files available</option>"
            : files.map(file => 
                `<option value="${file._id}">${file.filename}</option>`
              ).join("");

    } catch (error) {
        console.error("❌ Error loading files:", error);
        alert("Failed to load file list");
    }
}

// Replace your existing generateOneTimeLink function in script.js with:
async function generateOneTimeLink() {
    const fileId = document.getElementById("fileIdInput")?.value;
    const password = document.getElementById("passwordInput")?.value;
    const generatedLinkContainer = document.getElementById("generatedLink");
    
    if (!fileId) {
        alert("⚠️ Please select a file.");
        return;
    }

    if (!password || password.length < 6) {
        alert("⚠️ Please enter a password (minimum 6 characters).");
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        alert("⚠️ You need to log in.");
        return;
    }

    try {
        generatedLinkContainer.innerHTML = "Generating link...";

        const response = await fetch("/api/generate-onetime-link", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ fileId: fileId.trim(), password: password.trim() })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        generatedLinkContainer.innerHTML = `
            <div class="mt-4 p-4 bg-gray-100 rounded">
                <p class="text-green-600 mb-2">✅ Link generated successfully!</p>
                <div class="bg-white p-2 rounded border flex items-center gap-2">
                    <span class="flex-1 break-all">${data.link}</span>
                    <button onclick="copyToClipboard('${data.link}')" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">📋 Copy</button>
                </div>
                <p class="mt-2 text-sm text-gray-600">🔒 Link expires in 10 minutes<br>🔑 Password: ${password}</p>
            </div>
        `;
        document.getElementById("passwordInput").value = "";
    } catch (error) {
        console.error("❌ One-Time Link Error:", error);
        generatedLinkContainer.innerHTML = `<div class="mt-4 p-4 bg-red-100 rounded"><p class="text-red-600">❌ Error: ${error.message}</p></div>`;
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => alert("✅ Link copied to clipboard!"))
        .catch((err) => {
            console.error("❌ Copy failed:", err);
            alert("Failed to copy link");
        });
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("fileIdInput")) {
        loadFileSelection();
    }
});






document.addEventListener("DOMContentLoaded", function () {
    fetch('/api/currentUser')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.userId) {
                document.getElementById("userIdDisplay").textContent = "User ID: " + data.userId;
            }
        })
        .catch(error => console.error("Error fetching user ID:", error));
});







// Add this function to your script.js
function displayUserInfo(token) {
    try {
        // Decode the JWT token to get user information
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        
        // Display user email
        const userDisplay = document.getElementById('userDisplay');
        if (userDisplay) {
            userDisplay.textContent = `Email: ${tokenData.email}`;
        }
        
        // Display user ID
        const userIdDisplay = document.getElementById('userIdDisplay');
        if (userIdDisplay) {
            userIdDisplay.textContent = `ID: ${tokenData._id}`;
        }
    } catch (error) {
        console.error('Error displaying user info:', error);
    }
}

// Update your existing handleSignIn function
async function handleSignIn(event) {
    event.preventDefault();
    // ... your existing signin code ...

    try {
        const response = await fetch('/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('token', data.token);
            displayUserInfo(data.token); // Add this line
            // Update UI elements
            document.getElementById('signupBtn').style.display = 'none';
            document.getElementById('signinBtn').style.display = 'none';
            document.getElementById('logoutBtn').style.display = 'block';
            
            // Redirect if needed
            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            }
        } else {
            alert(data.message || 'Sign in failed');
        }
    } catch (error) {
        console.error('Sign in error:', error);
        alert('An error occurred during sign in');
    }
}

// Add this to your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    // ... your existing code ...

    // Check if user is already logged in and display info
    const token = localStorage.getItem('token');
    if (token) {
        displayUserInfo(token);
    }
});
// ✅ Generate One-Time Link with Password



// script.js

async function shareFileWithUser() {
    const fileId = document.getElementById('fileIdInput').value.trim();
    const recipientUserId = document.getElementById('recipientUserId').value.trim();
    const statusMessage = document.getElementById('shareStatus');
  
    if (!fileId || !recipientUserId) {
      statusMessage.textContent = '⚠️ Please select a file and enter a recipient User ID.';
      return;
    }
  
    statusMessage.textContent = '⏳ Sharing file...';
  
    try {
      const response = await fetch('/api/shareFiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Ensure token is valid
        },
        body: JSON.stringify({ fileId, recipientUserId })
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Server responded with ${response.status}:`, errorText);
        throw new Error(`Server Error (${response.status}): ${errorText}`);
      }
  
      const data = await response.json();
  
      if (data.success) {
        statusMessage.textContent = '✅ File shared successfully!';
      } else {
        statusMessage.textContent = `❌ Error: ${data.message}`;
      }
    } catch (error) {
      console.error('❌ Network or server error:', error);
      statusMessage.textContent = `❌ Network error: ${error.message}`;
    }
  }
  







//////





