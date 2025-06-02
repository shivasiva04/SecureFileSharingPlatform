# 🔐 Secure File Sharing Platform

A highly secure and privacy-focused file sharing platform that ensures end-to-end encryption, access control, and audit logging. Built to allow users to share sensitive files safely with features like time-limited download links and steganography.

---

## 🌟 Features

- 🔒 **End-to-End File Encryption**
- 🕒 **One-Time / Time-Limited Download Links**
- 👁️‍🗨️ **Steganography-based File Hiding & Sharing**
- 📁 **Encrypted File Storage using MongoDB GridFS**
- 👥 **User Authentication & Access Control**
- 🧾 **Audit Logging for File Activities**
- 🧪 **Data Breach Simulation & Response System**
- 📊 **Dashboard for Managing Shared Files**

---

## 🛠️ Tech Stack

| Component       | Technology                   |
|----------------|------------------------------|
| Frontend       | HTML, CSS, JavaScript        |
| Templating     | EJS                          |
| Backend        | Node.js, Express.js          |
| Database       | MongoDB (GridFS for storage) |
| Security       | Crypto, bcrypt, Helmet       |
| File Handling  | Multer, fs                   |
| Steganography  | Node-steg, Custom Script     |

---

## 📂 Project Structure

secure-file-sharing/
├── public/                 # Static assets (CSS, JS, images)
├── uploads/                # Temporarily stored uploaded files
├── views/                  # EJS templates for frontend rendering
├── routes/                 # Express route definitions
├── controllers/            # Business logic and controller functions
├── models/                 # MongoDB models and schemas
├── utils/                  # Utility modules (encryption, stego, logging)
├── .env                    # Environment variables
├── server.js               # Entry point of the application
└── README.md               # Project documentation



⚙️ Setup & Installation

3. 🧱 Install Dependencies
npm install

4. 🔑 Configure Environment Variables
Create a .env file in the root directory:

PORT=3000
MONGO_URI=mongodb://localhost:27017/secure-share
SESSION_SECRET=yourSuperSecretKey
ENCRYPTION_KEY=32charlongsecretkey!!  # Must be exactly 32 characters
🔐 Replace yourSuperSecretKey and ENCRYPTION_KEY with secure values.

4. ▶️ Start the Server
node server.js
Visit: http://localhost:3000
