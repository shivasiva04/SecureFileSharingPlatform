require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const path = require('path');
const File = require('./models/file.js');
const User = require('./models/user.js');
const SharedFile = require('./models/SharedFiles');



const app = express();
const PORT = 3000;
const encryptionKey = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';
const jwtSecret = process.env.JWT_SECRET || 'supersecretkey';

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/secureFileDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Express Settings
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // Ensures the browser only sends the cookie over HTTPS
      httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
      maxAge: 60000 // Sets the cookie expiration time in milliseconds
    }
  }));

// ✅ Multer Storage Configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Middleware to Verify JWT
function authenticateUser(req, res, next) {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) return res.status(401).json({ message: "No token provided. Please log in." });

        const token = authHeader.split(" ")[1];
        jwt.verify(token, jwtSecret, (err, user) => {
            if (err) return res.status(403).json({ message: "Invalid or expired token. Please log in again." });
            req.user = user;
            next();
        });
    } catch (error) {
        console.error("❌ Authentication error:", error);
        res.status(500).json({ message: "Internal Server Error during authentication." });
    }
}

// ✅ Encrypt/Decrypt File Functions
function encryptFile(buffer) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
    let encrypted = cipher.update(buffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { encryptedData: encrypted.toString('hex'), iv: iv.toString('hex') };
}

function decryptFile(encryptedData, iv) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(Buffer.from(encryptedData, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted;
}

// ✅ Authentication Routes
app.get('/signup', (req, res) => res.render('signup'));
app.post("/signup", async (req, res) => {
    try {
        const { username, email, gridSize, gridShape, pattern } = req.body;
        if (!username || !email || !gridSize || !gridShape || !pattern || !Array.isArray(pattern)) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists with this email." });

        const passwordString = `${gridSize}-${gridShape}-${pattern.join("-")}`;
        const hashedPassword = await bcrypt.hash(passwordString, 10);

        const newUser = new User({ username, email, gridSize, gridShape, pattern, hashedPassword });
        await newUser.save();

        res.json({ success: true, message: "User registered successfully. Please log in." });
    } catch (error) {
        console.error("❌ Signup Error:", error);
        res.status(500).json({ message: "An error occurred while registering." });
    }
});

app.get('/signin', (req, res) => res.render('signin'));
app.post("/signin", async (req, res) => {
    const { email, gridSize, gridShape, pattern } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.pattern || JSON.stringify(user.pattern) !== JSON.stringify(pattern)) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ _id: user._id, email: user.email }, jwtSecret, { expiresIn: '1h' });
    req.session.token = token;

    // Send both token and user data in response
    res.json({ 
        success: true, 
        token,
        userId: user._id.toString(), // Add the user ID
        email: user.email, // Add the email
        redirectUrl: "/dashboard" 
    });
});

// ✅ Secure File Upload Route
app.post('/upload', authenticateUser, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded." });

        const { encryptedData, iv } = encryptFile(req.file.buffer);

        const newFile = new File({
            filename: req.file.originalname,
            data: encryptedData,
            iv: iv,
            userId: req.user._id
        });

        await newFile.save();
        res.json({ success: true, message: "File uploaded successfully!" });
    } catch (error) {
        console.error("❌ Upload Error:", error);
        res.status(500).json({ message: "An error occurred during file upload." });
    }
});

// ✅ Sidebar Navigation Routes
app.get("/", (req, res) => res.render("index"));
app.get("/oneTimeLink", (req, res) => {
    res.render("oneTimeLink");  // Ensure this file exists in views/
});

app.get("/userToUser", (req, res) => {
    res.render("userToUser", { layout: false });
});

app.get("/steganography", (req, res) => {
    res.render("steganography", { layout: false });
});



// ✅ Get User Files
app.get('/my-files', authenticateUser, async (req, res) => {
    try {
        const files = await File.find({ userId: req.user._id }).select("filename _id");
        console.log("📁 Files Found:", files); 
        res.json(files);
    } catch (error) {
        console.error("❌ Fetching Files Error:", error);
        res.status(500).json({ message: "An error occurred while fetching files." });
    }
});

// ✅ Delete File Route
app.delete("/delete/:id", authenticateUser, async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
        if (!file) return res.status(404).json({ message: "File not found or unauthorized" });

        await File.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "File deleted successfully!" });
    } catch (error) {
        console.error("❌ Delete Error:", error);
        res.status(500).json({ message: "An error occurred while deleting the file." });
    }
});

// ✅ Logout Route
app.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/signin"));
});

// ✅ Catch-All Route for 404 Errors




app.use((req, res, next) => {
    console.log(`➡️ Received Request: ${req.method} ${req.url}`);
    next();
});


/////////


const oneTimeLinks = new Map();

app.post("/api/generate-onetime-link", authenticateUser, async (req, res) => {
    console.log("POST /api/generate-onetime-link called");
    try {
        const { fileId, password } = req.body;

        if (!fileId || !password) {
            console.log("Missing fileId or password");
            return res.status(400).json({ success: false, message: "File ID and password are required." });
        }

        const file = await File.findOne({ _id: fileId, userId: req.user._id });
        console.log("File found:", file);

        if (!file) {
            console.log("File not found or unauthorized");
            return res.status(404).json({ success: false, message: "File not found or unauthorized." });
        }

        // 🔐 Hash the password before storing
        const passwordHash = await bcrypt.hash(password, 10);
        
        const token = crypto.randomBytes(32).toString("hex");
        oneTimeLinks.set(token, {
            fileId,
            passwordHash,  // Store the hashed password
            filename: file.filename,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10-minute expiry
            attempts: 0,
            userId: req.user._id
        });

        const downloadLink = `${req.protocol}://${req.get("host")}/api/download/${token}`;
        console.log("🔗 Link generated:", downloadLink);
        return res.json({ success: true, link: downloadLink, expiresIn: "10 minutes" });
    } catch (error) {
        console.error("❌ Link Generation Error:", error);
        return res.status(500).json({ success: false, message: "Failed to generate link" });
    }
});

app.get("/api/download/:token", async (req, res) => {
    console.log("📥 GET /api/download/:token called");
    try {
        const { token } = req.params;
        const { password } = req.query;

        if (!oneTimeLinks.has(token)) {
            console.log("❌ Invalid or expired link");
            return res.status(404).send("Invalid or expired link.");
        }

        const linkData = oneTimeLinks.get(token);
        if (!linkData) {
            console.log("❌ No data found for token.");
            return res.status(404).send("Invalid or expired link.");
        }

        // 🔍 If no password is provided, render the `download.ejs` page
        if (!password) {
            console.log("⚠️ No password provided. Redirecting to download page...");
            return res.render("download", { token }); // Pass token to the template
        }

        // 🔑 Compare entered password with stored hashed password
        const passwordMatch = await bcrypt.compare(password, linkData.passwordHash);
        if (!passwordMatch) {
            linkData.attempts++;
            console.log(`❌ Invalid password. ${3 - linkData.attempts} attempts remaining.`);
            if (linkData.attempts >= 3) {
                oneTimeLinks.delete(token);
                return res.status(401).send("Too many failed attempts. Link revoked.");
            }
            return res.status(401).send(`Invalid password. ${3 - linkData.attempts} attempts remaining.`);
        }

        // ✅ Fetch the file from the database
        const file = await File.findById(linkData.fileId);
        if (!file) {
            oneTimeLinks.delete(token);
            return res.status(404).send("File no longer exists.");
        }

        console.log("🔓 File found, decrypting...");
        let decryptedData;
        try {
            decryptedData = decryptFile(file.data, file.iv);
        } catch (error) {
            console.error("❌ Decryption failed:", error);
            return res.status(500).send("File decryption failed.");
        }

        // ✅ Delete the link after successful download
        oneTimeLinks.delete(token);

        // 📩 Send the file for download
        res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
        res.setHeader("Content-Type", "application/octet-stream");
        console.log("✅ File downloaded successfully");
        return res.send(decryptedData);
    } catch (error) {
        console.error("❌ Download Error:", error);
        return res.status(500).send("Download failed.");
    }
});







app.get('/api/currentUser', (req, res) => {
    if (req.user) {
        res.json({ userId: req.user.id });
    } else {
        res.status(401).json({ error: "User not authenticated" });
    }
});




// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));








// Ensure JSON parsing is enabled

app.post('/api/shareFiles', authenticateUser, async (req, res) => {
    try {
        const { fileId, recipientUserId } = req.body;

        console.log(`🔍 Received share request for File ID: ${fileId}, Recipient ID: ${recipientUserId}`);

        if (!fileId || !recipientUserId) {
            return res.status(400).json({ success: false, message: '❌ File ID and recipient User ID are required.' });
        }

        console.log('🔑 Authenticated User:', req.user);

        const file = await File.findById(fileId).exec();
        if (!file) {
            console.log('❌ File not found in database.');
            return res.status(404).json({ success: false, message: '❌ File not found.' });
        }

        console.log('📂 File Found:', file);

        const sharedFile = new SharedFile({
            fileId,
            originalOwner: req.user._id,
            recipientUserId,
            sharedAt: new Date()
        });

        await sharedFile.save();
        console.log('✅ File shared successfully!');

        res.json({ success: true, message: '✅ File shared successfully!' });
    } catch (error) {
        console.error('❌ Error sharing file:', error.message, error.stack);
        res.status(500).json({ success: false, message: `❌ Internal server error: ${error.message}` });
    }
});

// Start the server



// ✅ Get Current User Route
app.get('/api/currentUser', authenticateUser, (req, res) => {
    res.json({ userId: req.user._id });
});

// ✅ Catch-all for undefined routes




//////


////////





//////////






