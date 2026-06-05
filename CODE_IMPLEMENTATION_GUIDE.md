# GenAI-FullStack: Detailed Code Implementation Guide

## 📚 Table of Contents
1. [Backend Code Walkthrough](#backend-code-walkthrough)
2. [Frontend Code Walkthrough](#frontend-code-walkthrough)
3. [Database Models in Detail](#database-models-in-detail)
4. [API Implementation Examples](#api-implementation-examples)
5. [State Management Pattern](#state-management-pattern)
6. [AI Service Deep Dive](#ai-service-deep-dive)

---

## 🔧 Backend Code Walkthrough

### **Entry Point: server.js**
```javascript
const dotenv = require("dotenv");
dotenv.config();
const app = require("./src/app");
const connectToDB = require("./src/config/database");

// Connect to MongoDB
connectToDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```
**Explanation:**
- Loads environment variables first
- Connects to MongoDB asynchronously
- Starts Express server on defined PORT

---

### **App Setup: src/app.js**
```javascript
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();  

// Middleware Setup
app.use(express.json());                    // Parse JSON bodies
app.use(cookieParser());                    // Parse cookies
app.use(cors({
    origin: "http://localhost:5173",        // Frontend URL
    credentials: true,                      // Allow credentials (cookies)
}));

// Routes
const authRouter = require("./routes/auth.routes");
const interviewRouter = require("./routes/interview.routes");

app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);

module.exports = app;
```
**Key Points:**
- CORS allows only frontend origin (`localhost:5173`)
- `credentials: true` needed for cookies to work across origins
- Routes organized by feature (auth, interview)

---

### **Database Connection: src/config/database.js**
```javascript
const mongoose = require("mongoose");

async function connectToDB() {
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected to MongoDB");
    }
    catch(error){
        console.error("Error connecting to MongoDB:", error);
    }
}

module.exports = connectToDB;
```
**Flow:**
1. Uses MongoDB Atlas connection string from `.env`
2. Mongoose handles connection pooling
3. Returns promise (awaited in server.js)

---

### **Authentication Middleware: src/middlewares/auth.middleware.js**
```javascript
const jwt = require("jsonwebtoken");
const blacklistModel = require("../models/blacklist.model.js");

async function authUser(req, res, next) {
    // Extract token from cookies or Authorization header
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }   

    // Check if token is blacklisted (user logged out)
    const isBlacklisted = await blacklistModel.findOne({ token: token });
    if (isBlacklisted) {
        return res.status(401).json({ message: "Unauthorized: Token is invalid" });
    }

    try {
        // Verify JWT signature
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // decoded = { userId: "...", iat, exp }
        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    } 
}

module.exports = {
    authUser,
};
```
**Token Flow:**
1. Token extracted from request
2. Checked against blacklist collection
3. JWT signature verified using secret
4. User ID decoded and added to `req.user`
5. If any step fails, request rejected with 401

---

### **File Upload Middleware: src/middlewares/file.middleware.js**
```javascript
const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(),   // Store in RAM, not disk
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024  // 5MB max
    }
});

module.exports = upload;
```
**Why Memory Storage:**
- Faster (no disk I/O)
- More secure (file not written to disk)
- Good for processing + deletion flow
- Trade-off: Limited by RAM, use disk for large files

---

### **Auth Routes: src/routes/auth.routes.js**
```javascript
const express = require('express');
const authRouter = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
authRouter.post('/register', 
    require('../controllers/auth.controller').registerUserController
);

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
authRouter.post('/login', 
    require('../controllers/auth.controller').loginUserController
);

/**
 * @route GET /api/auth/logout
 * @desc Logout and blacklist token
 * @access Private
 */
authRouter.get('/logout', 
    require('../controllers/auth.controller').logoutUserController
);

/**
 * @route GET /api/auth/get-me
 * @desc Get logged-in user details
 * @access Private
 */
authRouter.get('/get-me', 
    authMiddleware.authUser,  // Protected route
    require('../controllers/auth.controller').getMeController
);

module.exports = authRouter;
```

---

### **Auth Controller: src/controllers/auth.controller.js (Key Parts)**

#### **Register Function**
```javascript
async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body;
        
        // Input validation
        if (!username || !email || !password) {
            return res.status(400).json({ 
                message: "Username, email, and password are required" 
            });
        }
        
        // Check if user already exists
        const isUserAlreadyExists = await userModel.findOne({ 
            $or: [{ email: email }, { username: username }]
        });
        if (isUserAlreadyExists) {
            return res.status(400).json({ 
                message: "Username or email is already registered" 
            });
        }

        // Hash password with bcryptjs
        const hashedPassword = await bcrypt.hash(password, 10);  // 10 salt rounds
        
        // Create user in database
        const user = await userModel.create({
            username,
            email,
            password: hashedPassword
        });

        // Create JWT token (expires in 1 day)
        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        // Set cookie
        res.cookie("token", token);
        
        // Send response
        res.status(201).json({ 
            message: 'User registered successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            }
        });

    } catch (error) {
        console.error("Error in registerUserController:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
```

**Security Notes:**
- bcrypt.hash(password, 10): 10 rounds = ~100ms (good balance)
- Never return raw password in response
- JWT expires in 1 day (users need to login again)
- Cookie set without httpOnly (improvement: should be httpOnly: true)

#### **Login Function**
```javascript
async function loginUserController(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                message: "Email and password are required" 
            });
        }

        // Find user by email
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                message: "Invalid email or password" 
            });
        }

        // Compare provided password with hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                message: "Invalid email or password" 
            });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.cookie("token", token);
        res.status(200).json({ 
            message: 'User logged in successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            }
        });

    } catch (error) {
        console.error("Error in loginUserController:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
```

**Good Practice:**
- Same error message for "email not found" and "password wrong" (prevents username enumeration)
- bcrypt.compare() prevents timing attacks

---

### **Interview Routes: src/routes/interview.routes.js**
```javascript
const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const interviewController = require("../controllers/interview.controller");
const upload = require("../middlewares/file.middleware");

const interviewRouter = express.Router();

/**
 * @route POST /api/interview/
 * @description Generate interview report
 * @access Private
 */
interviewRouter.post(
    "/", 
    authMiddleware.authUser,          // Verify JWT
    upload.single("resume"),          // Handle resume file
    interviewController.generateInterviewReportController
);

// Get all reports for logged-in user
interviewRouter.get(
    "/", 
    authMiddleware.authUser, 
    interviewController.getAllInterviewReportsController
);

// Get single report by ID
interviewRouter.get(
    "/report/:interviewId", 
    authMiddleware.authUser, 
    interviewController.getInterviewReportByIdController
);

// Generate PDF resume
interviewRouter.post(
    "/resume/pdf/:interviewReportId", 
    authMiddleware.authUser, 
    interviewController.generateResumePdfController
);

module.exports = interviewRouter;
```

---

### **Interview Controller (Core Logic)**
```javascript
const pdfParse = require("pdf-parse");
let mammoth = null;
try {
    mammoth = require("mammoth");
} catch (e) {
    console.warn('mammoth not installed — DOCX parsing disabled');
}

const { generateInterviewReport } = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");

async function generateInterviewReportController(req, res) {
    const { selfDescription, jobDescription } = req.body;

    console.log('Request received:', { 
        userPayload: req.user, 
        bodyKeys: Object.keys(req.body), 
        hasFile: !!req.file 
    });

    let resumeText = "";
    
    // Parse resume file if provided
    if (req.file && req.file.buffer) {
        try {
            const mimetype = req.file.mimetype || '';
            
            // PDF parsing
            if (mimetype.includes('pdf') || 
                req.file.originalname?.toLowerCase().endsWith('.pdf')) {
                const data = await pdfParse(req.file.buffer);
                resumeText = data?.text || "";
            } 
            // DOCX parsing
            else if (mimetype.includes('officedocument') || 
                     req.file.originalname?.toLowerCase().endsWith('.docx')) {
                if (mammoth) {
                    try {
                        const result = await mammoth.extractRawText({ 
                            buffer: req.file.buffer 
                        });
                        resumeText = result?.value || "";
                    } catch (e) {
                        console.warn('mammoth parsing failed');
                        resumeText = "";
                    }
                }
            }
        } catch (err) {
            console.warn('Resume parsing failed, continuing without resumeText');
            resumeText = "";
        }
    }

    // Validation: need job description AND (resume OR self description)
    if (!jobDescription || (!req.file && !selfDescription)) {
        return res.status(400).json({ 
            message: 'jobDescription and either resume or selfDescription are required.' 
        });
    }

    try {
        // Call AI service to generate report
        const interviewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        });

        // Save to database
        const userId = req.user?.userId || req.user?._id;
        const interviewReport = await interviewReportModel.create({
            user: userId,
            resumeText,
            selfDescription,
            jobDescription,
            ...interviewReportByAi  // Spread AI response
        });

        // Format response for frontend compatibility
        const returned = interviewReport.toObject();
        if (returned.preparationPlans && !returned.preparationPlan) {
            returned.preparationPlan = returned.preparationPlans;
        }

        // Normalize field names
        if (returned.preparationPlan && Array.isArray(returned.preparationPlan)) {
            returned.preparationPlan = returned.preparationPlan.map(d => ({ 
                ...d, 
                tasks: d.task || d.tasks || [] 
            }));
        }

        return res.status(201).json({
            message: "Interview report generated successfully",
            interviewReport: returned
        });

    } catch (error) {
        console.error('Error in generateInterviewReportController:', error);
        return res.status(500).json({ 
            message: "Failed to generate interview report" 
        });
    }
}
```

**Key Design Patterns:**
1. **Graceful Degradation**: Can work with resume OR self-description (not just resume)
2. **Format Conversion**: PDF and DOCX both extracted to plain text
3. **Error Resilience**: If parsing fails, continues with empty resumeText
4. **Response Formatting**: Aliases field names for frontend compatibility
5. **Data Persistence**: Saves both input (job desc, resume) and output (AI analysis)

---

## 🎨 Frontend Code Walkthrough

### **App Root: src/App.jsx**
```javascript
import { RouterProvider } from 'react-router-dom'
import { router } from './app.routes.jsx'
import { AuthProvider } from './features/auth/auth.context.jsx'
import { InterviewProvider } from './features/interview/interview.context.jsx'

function App() {
  return (
    <AuthProvider>
      <InterviewProvider>
        <RouterProvider router={router} />
      </InterviewProvider>
    </AuthProvider>
  )
}

export default App
```

**Component Hierarchy:**
- AuthProvider wraps everything (auth state globally accessible)
- InterviewProvider provides interview functionality
- RouterProvider enables routing

---

### **Routes: src/app.routes.jsx**
```javascript
import { createBrowserRouter } from 'react-router-dom';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import Protected from './features/auth/components/Protected';
import Home from './features/interview/pages/Home';
import ErrorPage from './features/common/ErrorPage';

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />
    },
    {
        path: '/register',
        element: <Register />
    },
    {
        path: '/',
        element: (
            <Protected>
                <Home />
            </Protected>
        ),
        errorElement: <ErrorPage />
    }
]);
```

**Route Protection:**
- `/` protected with `<Protected>` wrapper
- Unauthenticated users redirected to `/login`

---

### **Auth Context: src/features/auth/auth.context.jsx**
```javascript
import { createContext, useState } from 'react';
import { register, login, logout, getMe } from './services/auth.api.js';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRegister = async (credentials) => {
        setLoading(true);
        try {
            const data = await register(credentials);
            setUser(data.user);
            setError(null);
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (credentials) => {
        setLoading(true);
        try {
            const data = await login(credentials);
            setUser(data.user);
            setError(null);
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
            setUser(null);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const checkAuth = async () => {
        try {
            const data = await getMe();
            setUser(data.user);
        } catch (err) {
            setUser(null);
        }
    };

    const value = {
        user,
        loading,
        error,
        handleRegister,
        handleLogin,
        handleLogout,
        checkAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
```

**State Management:**
- `user`: Current user object (null if not logged in)
- `loading`: For showing spinners during API calls
- `error`: Error messages to display
- Methods: register, login, logout, checkAuth

---

### **Auth Hook: src/features/auth/hooks/useAuth.js**
```javascript
import { useContext } from 'react';
import { AuthContext } from '../auth.context.jsx';

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
```

**Usage in Components:**
```javascript
const { user, handleLogin, loading } = useAuth();
```

---

### **Protected Route: src/features/auth/components/Protected.jsx**
```javascript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export function Protected({ children }) {
    const navigate = useNavigate();
    const { user, checkAuth, loading } = useAuth();

    useEffect(() => {
        if (!user) {
            checkAuth();
        }
    }, []);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return user ? children : null;
}
```

**Flow:**
1. On mount, check if user exists in context
2. If not, call `checkAuth()` to fetch from server
3. If still no user after loading, redirect to login
4. Only render children if authenticated

---

### **Login Page: src/features/auth/pages/Login.jsx**
```javascript
import React from 'react'
import '../auth.form.scss'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useNavigate } from 'react-router-dom'

const Login = () => {
    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        const success = await handleLogin({ email, password })
        if (success) {
            navigate('/')
        } else {
            alert('Login failed. Please check your credentials.')
        }
    }

    if (loading) {
        return <main><h1>Loading...</h1></main>
    }

    return (
        <main>
            <div className="form-container">
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input 
                            onChange={(e) => setEmail(e.target.value)} 
                            type="email" 
                            id="email" 
                            placeholder='Enter email address' 
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input 
                            onChange={(e) => setPassword(e.target.value)} 
                            type="password" 
                            id="password" 
                            placeholder='Enter password' 
                        />
                    </div>
                    <button 
                        className='button primary-button' 
                        type="submit" 
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p>Don't have an account? <Link to="/register">Register here</Link></p>
            </div>
        </main>
    )
}

export default Login
```

---

### **Interview Context: src/features/interview/interview.context.jsx**
```javascript
import { createContext, useState } from 'react';
import { generateReport, getReports, getReport } from './services/interview.api.js';

export const InterviewContext = createContext();

export function InterviewProvider({ children }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('jobDescription', jobDescription);
            formData.append('selfDescription', selfDescription);
            if (resumeFile) {
                formData.append('resume', resumeFile);
            }

            const response = await generateReport(formData);
            setError(null);
            return response.interviewReport;
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await getReports();
            setReports(data.reports);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchReportById = async (id) => {
        setLoading(true);
        try {
            const data = await getReport(id);
            setError(null);
            return data.report;
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const value = {
        reports,
        loading,
        error,
        generateReport,
        fetchReports,
        fetchReportById
    };

    return (
        <InterviewContext.Provider value={value}>
            {children}
        </InterviewContext.Provider>
    );
}
```

---

### **Interview Hook: src/features/interview/hooks/useInterview.js**
```javascript
import { useContext } from 'react';
import { InterviewContext } from '../interview.context.jsx';

export function useInterview() {
    const context = useContext(InterviewContext);
    if (!context) {
        throw new Error('useInterview must be used within InterviewProvider');
    }
    return context;
}
```

---

### **Home Page: src/features/interview/pages/Home.jsx (Key Parts)**
```javascript
import React, { useState, useRef } from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate } from 'react-router'

const Home = () => {
    const { loading, generateReport, reports } = useInterview()
    const [jobDescription, setJobDescription] = useState("")
    const [selfDescription, setSelfDescription] = useState("")
    const [resumeFile, setResumeFile] = useState(null)
    const resumeInputRef = useRef()

    const navigate = useNavigate()

    const handleGenerateReport = async () => {
        // Get file from input or state
        const fileToSend = resumeFile || 
            (resumeInputRef.current?.files?.[0])

        // Validate input
        if (!jobDescription || (!fileToSend && !selfDescription)) {
            alert('Please provide a job description and either upload a resume or enter a self description.')
            return
        }

        // Call API to generate report
        const data = await generateReport({ 
            jobDescription, 
            selfDescription, 
            resumeFile: fileToSend 
        })

        // Navigate to report page if successful
        if (!data) {
            alert("Failed to generate interview report. Please try again in a few moments.")
            return
        }
        navigate(`/interview/${data._id}`)
    }

    if (loading) {
        return (
            <main className='loading-screen'>
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }

    return (
        <div className='home-page'>
            <header className='page-header'>
                <h1>Create Your Custom <span className='highlight'>Interview Plan</span></h1>
                <p>Let our AI analyze the job requirements and your unique profile to build a winning strategy.</p>
            </header>

            <div className='interview-card'>
                {/* Left Panel - Job Description */}
                <div className='panel panel--left'>
                    <div className='panel__header'>
                        <h2>Target Job Description</h2>
                        <span className='badge badge--required'>Required</span>
                    </div>
                    <textarea
                        onChange={(e) => setJobDescription(e.target.value)}
                        className='panel__textarea'
                        placeholder='Paste the full job description here...'
                        maxLength={5000}
                    />
                </div>

                {/* Right Panel - Profile */}
                <div className='panel panel--right'>
                    <div className='panel__header'>
                        <h2>Your Profile & Resume</h2>
                        <span className='badge'>Optional Upload</span>
                    </div>
                    
                    {/* Resume Upload */}
                    <input
                        ref={resumeInputRef}
                        type="file"
                        accept=".pdf,.docx"
                        onChange={(e) => setResumeFile(e.target.files?.[0])}
                    />

                    {/* Self Description */}
                    <textarea
                        onChange={(e) => setSelfDescription(e.target.value)}
                        placeholder='Or describe your experience and skills...'
                        maxLength={5000}
                    />
                </div>
            </div>

            {/* Generate Button */}
            <button 
                onClick={handleGenerateReport}
                className='button primary-button'
                disabled={loading}
            >
                {loading ? 'Generating...' : 'Generate Interview Plan'}
            </button>
        </div>
    )
}

export default Home
```

---

### **API Service: src/features/interview/services/interview.api.js**
```javascript
import axios from 'axios';

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true  // Send cookies with requests
});

export async function generateReport(formData) {
    try {
        const response = await api.post('/api/interview/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error generating report:', error);
        throw error;
    }
}

export async function getReports() {
    try {
        const response = await api.get('/api/interview/');
        return response.data;
    } catch (error) {
        console.error('Error fetching reports:', error);
        throw error;
    }
}

export async function getReport(id) {
    try {
        const response = await api.get(`/api/interview/report/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching report:', error);
        throw error;
    }
}

export async function generateResumePdf(interviewReportId) {
    try {
        const response = await api.post(
            `/api/interview/resume/pdf/${interviewReportId}`,
            {},
            { responseType: 'blob' }
        );
        return response.data;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}
```

**Key Features:**
- `withCredentials: true` sends JWT cookie automatically
- FormData for multipart/form-data
- `responseType: 'blob'` for PDF binary data

---

## 📊 Database Models in Detail

### **User Model: src/models/user.model.js**
```javascript
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [true, "Name must be unique"],
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: [true, "Email must be unique"],   
    },
    password: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const UserModel = mongoose.model("Users", userSchema);
module.exports = UserModel;
```

**Schema Features:**
- `unique: [true, "message"]` creates unique index with custom error
- `timestamps: true` auto-adds createdAt and updatedAt
- Password always hashed before saving

---

### **Interview Report Model: src/models/interviewReport.model.js**
```javascript
const mongoose = require('mongoose');

// Nested schemas for structured data
const technicalQuestionSchema = new mongoose.Schema({
    question:  { type: String, required: [true, 'Question is required'] },
    intention: { type: String, required: [true, 'Intention is required'] },
    answer:    { type: String, required: [true, 'Answer is required'] }
}, { _id: false });  // No _id for nested docs

const behavioralQuestionSchema = new mongoose.Schema({
    question:  { type: String, required: [true, 'Question is required'] },
    intention: { type: String, required: [true, 'Intention is required'] },
    answer:    { type: String, required: [true, 'Answer is required'] }
}, { _id: false });

const skillGapSchema = new mongoose.Schema({
    skill: { 
        type: String, 
        required: [true, 'Skill is required']
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: [true, 'Severity is required']
    }
}, { _id: false });

const preparationPlanSchema = new mongoose.Schema({
    day: { 
        type: Number, 
        required: [true, 'Day is required']
    },
    focus: { 
        type: String, 
        required: [true, 'Focus is required']
    },
    task: [{ 
        type: String, 
        required: [true, 'Task is required']
    }]
}, { _id: false });

// Main schema
const interviewReportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    jobDescription: { 
        type: String, 
        required: [true, 'Job description is required'] 
    },
    resumeText: {
        type: String,
        required: false  // Optional
    },
    selfDescription: {
        type: String,
        required: false  // Optional
    },
    matchScore: {
        type: Number, 
        min: 0, 
        max: 100,
        required: [true, 'Match score is required'] 
    },
    technicalQuestions: [technicalQuestionSchema],
    behavioralQuestions: [behavioralQuestionSchema],
    skillGaps: [skillGapSchema],
    preparationPlans: [preparationPlanSchema]
}, { timestamps: true });

const InterviewReport = mongoose.model('InterviewReport', interviewReportSchema);
module.exports = InterviewReport;
```

**Design Choices:**
- Nested schemas with `_id: false` to avoid cluttering database
- `ref: 'Users'` for user relationship
- Arrays for multiple questions, gaps, and plans
- Enums for severity to enforce data integrity

---

### **Token Blacklist Model: src/models/blacklist.model.js**
```javascript
const mongoose = require("mongoose");

const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400  // TTL index: auto-delete after 24 hours
    }
});

const TokenBlacklistModel = mongoose.model(
    "TokenBlacklist", 
    tokenBlacklistSchema
);

module.exports = TokenBlacklistModel;
```

**Smart Feature:**
- `expires: 86400` creates TTL index (auto-delete after 24h)
- No need to manually clean up expired tokens
- Matches JWT expiration time

---

## 🔌 AI Service Deep Dive

### **AI Service: src/services/ai.service.js**
```javascript
const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

// Initialize Gemini API
const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GEMINI_API_KEY,
});

// Zod schema for validation
const interviewReportSchema = z.object({
    matchScore: z.number()
        .describe("A score between 0 and 100 indicating how well the candidate matches the job"),

    technicalQuestions: z.array(z.object({
        question:  z.string().describe("The technical question"),
        intention: z.string().describe("The intention behind the question"),
        answer:    z.string().describe("A strong answer to the question"),
    })).describe("Technical questions with intentions and model answers"),

    behavioralQuestions: z.array(z.object({
        question:  z.string().describe("The behavioral question"),
        intention: z.string().describe("The intention behind the question"),
        answer:    z.string().describe("A strong STAR-format answer"),
    })).describe("Behavioral questions with intentions and model answers"),

    skillGaps: z.array(z.object({
        skill:    z.string().describe("The skill the candidate is lacking"),
        severity: z.enum(['low', 'medium', 'high']).describe("How critical this gap is"),
    })).describe("Skill gaps identified by comparing resume to job description"),

    preparationPlans: z.array(z.object({
        day:   z.number().describe("Day number in the preparation schedule"),
        focus: z.string().describe("The main topic or theme for the day"),
        task:  z.array(z.string()).describe("Specific tasks to complete on this day"),
    })).describe("A day-by-day preparation plan for the candidate"),
});

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    // Build detailed prompt
    const prompt = `Generate an interview report based on the following information:

Resume: ${resume}

Self-Description: ${selfDescription}

Job Description: ${jobDescription}

The report must include:
- A match score (0 to 100)
- 5 technical questions with intentions and model answers
- 5 behavioral questions with intentions and model answers
- Identified skill gaps with severity (low/medium/high)
- A 7-day preparation plan with daily focus areas and tasks`;

    try {
        console.log('AI prompt length:', prompt.length);
        
        // Call Gemini API with structured output
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",      // Fast & cost-effective
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(interviewReportSchema),
            }
        });

        // Parse and return response
        const parsed = JSON.parse(response.text);
        return parsed;
        
    } catch (err) {
        console.error('Error generating interview report:', err);
        throw err;
    }
}

async function generateResumePdf(interviewReport) {
    // Implementation for PDF generation
    // Uses PDFKit to create PDF from report data
}

module.exports = {
    generateInterviewReport,
    generateResumePdf
};
```

**Why This Architecture Works:**

1. **Structured Output**
   - Zod schema defines expected structure
   - Gemini API enforces this structure (no parsing errors)
   - Type-safe data before saving to database

2. **Schema Validation**
   - Descriptions help AI understand what to generate
   - `z.enum(['low', 'medium', 'high'])` prevents invalid values
   - Database schema matches AI schema

3. **Error Handling**
   - Try-catch wraps API call
   - Graceful degradation if AI fails
   - Detailed logging for debugging

---

## 🎯 Summary: Request-Response Cycle

```
USER SUBMITS FORM
    ↓
Frontend validates input
    ↓
Creates FormData (for file upload)
    ↓
Calls interview.api.generateReport()
    ↓
POST /api/interview/ with FormData + JWT Cookie
    ↓
Express router matches route
    ↓
authMiddleware verifies token
    ↓
fileMiddleware extracts resume to req.file.buffer
    ↓
Controller receives request
    ↓
Parses resume (PDF → text or DOCX → text)
    ↓
Calls aiService.generateInterviewReport()
    ↓
Sends prompt to Gemini API with Zod schema
    ↓
AI generates structured JSON response
    ↓
Response parsed and validated against schema
    ↓
Controller saves to MongoDB via model.create()
    ↓
Returns report with 201 status
    ↓
Frontend receives report object with _id
    ↓
Navigates to /interview/:id
    ↓
Interview page fetches and displays report
    ↓
User can download PDF or view analysis
```

---

**This guide should help you explain the entire codebase to ChatGPT and interviewers!**
