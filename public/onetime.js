// Upload and Encrypt File
function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const password = document.getElementById('passwordInput').value;
    const file = fileInput.files[0];

    if (!file || !password) {
        alert('Please select a file and set a password.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const fileData = event.target.result;

        // Encrypt File Data
        const encrypted = CryptoJS.AES.encrypt(fileData, password).toString();

        // Create Unique File ID
        const fileId = Date.now().toString(36);

        // Store in Local Storage
        localStorage.setItem(fileId, encrypted);
        localStorage.setItem(fileId + "_pwd", password);

        // Generate One-Time Link
        const link = `view5.html?file=${fileId}`;
        document.getElementById('linkDisplay').innerHTML = `
            <strong>One-Time Link:</strong> 
            <a href="${link}" target="_blank">Open Link</a>
            <br>(Share the password securely)
        `;
    };

    reader.readAsDataURL(file);
}

// View and Decrypt File
function viewFile() {
    const urlParams = new URLSearchParams(window.location.search);
    const fileId = urlParams.get('file');
    const enteredPassword = document.getElementById('passwordInput').value;

    const encryptedData = localStorage.getItem(fileId);
    const storedPassword = localStorage.getItem(fileId + "_pwd");

    if (!encryptedData || !storedPassword) {
        alert('This link has expired or the file has been viewed already.');
        window.location.href = 'index5.html';
        return;
    }

    if (enteredPassword !== storedPassword) {
        alert('Incorrect Password');
        return;
    }

    // Decrypt File Data
    const decrypted = CryptoJS.AES.decrypt(encryptedData, storedPassword);
    const originalData = decrypted.toString(CryptoJS.enc.Utf8);

    // Display File Content
    document.getElementById('fileContent').innerHTML = `
        <iframe src="${originalData}" width="100%" height="400px"></iframe>
    `;

    // One-Time Access: Delete After Viewing
    localStorage.removeItem(fileId);
    localStorage.removeItem(fileId + "_pwd");
}
