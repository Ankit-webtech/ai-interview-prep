# GenAI-FullStack: System Architecture & Code Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [Database Design](#database-design)
5. [API Endpoints](#api-endpoints)
6. [Frontend Structure](#frontend-structure)
7. [Backend Structure](#backend-structure)
8. [Authentication Flow](#authentication-flow)
9. [Interview Generation Flow](#interview-generation-flow)
10. [Key Features](#key-features)

---

## 🎯 Project Overview

**GenAI-FullStack** is an AI-powered interview preparation platform that helps candidates prepare for job interviews. It analyzes job descriptions, resumes, and candidate profiles to generate personalized interview reports with technical questions, behavioral questions, skill gaps analysis, and a 7-day preparation plan using Google's Gemini AI.

**Key Purpose:**
- Enable candidates to understand job requirements
- Identify skill gaps between candidate profile and job description
- Generate realistic interview questions with model answers
- Provide structured 7-day preparation plan
- Generate professional interview reports in PDF format

---

## 🛠️ Tech Stack

### **Backend**
| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js |
| **Framework** | Express.js 5.2.1 |
| **Database** | MongoDB + Mongoose 9.6.2 |
| **Authentication** | JWT (jsonwebtoken 9.0.3) |
| **AI/ML** | Google Gemini API 2.0-flash (@google/genai 2.3.0) |
| **Password Encryption** | bcryptjs 3.0.3 |
| **File Upload** | Multer 2.1.1 |
| **File Parsing** | PDF-parse 2.4.5, Mammoth 1.12.0 |
| **PDF Generation** | PDFKit 0.13.0 |
| **Data Validation** | Zod 4.4.3 |
| **Development** | Nodemon 3.1.14 |
| **Environment** | dotenv 17.4.2 |

### **Frontend**
| Layer | Technology |
|-------|-----------|
| **Framework** | React 19.2.6 |
| **Build Tool** | Vite 8.0.12 |
| **Routing** | React Router DOM 7.15.0 |
| **State Management** | React Context API |
| **HTTP Client** | Axios 1.16.1 |
| **Styling** | SCSS/SASS 1.99.0 |
| **Linting** | ESLint 10.3.0 |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (FRONTEND)                       │
│  React + Vite + React Router + Context API + SCSS          │
├─────────────────────────────────────────────────────────────┤
│  Pages: Login, Register, Home, Interview Report            │
│  Features: Auth, Interview Management                      │
│  Services: API calls via Axios                             │
└────────────────┬────────────────────────────────────────────┘
                 │
         HTTP/REST API (Port 3000)
                 │
┌────────────────▼────────────────────────────────────────────┐
│               BACKEND (EXPRESS.js)                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Routes Layer                                        │  │
│  │  • /api/auth (register, login, logout, get-me)      │  │
│  │  • /api/interview (generate, get, PDF export)       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ▲                                  │
│  ┌──────────────────────┴──────────────────────────────┐  │
│  │  Middleware Layer                                   │  │
│  │  • authMiddleware (JWT verification)                │  │
│  │  • fileMiddleware (Multer for file upload)          │  │
│  │  • CORS, Cookie Parser                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ▲                                  │
│  ┌──────────────────────┴──────────────────────────────┐  │
│  │  Controller Layer                                   │  │
│  │  • authController (register, login, logout, getMe)  │  │
│  │  • interviewController (generate, get, PDF export)  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ▲                                  │
│  ┌──────────────────────┴──────────────────────────────┐  │
│  │  Service Layer                                      │  │
│  │  • aiService (Gemini AI integration)                │  │
│  │  • interviewService (business logic)                │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ▲                                  │
│  ┌──────────────────────┴──────────────────────────────┐  │
│  │  Data Layer (Mongoose Models)                       │  │
│  │  • User (username, email, password)                 │  │
│  │  • InterviewReport (analysis & questions)           │  │
│  │  • TokenBlacklist (logout tokens)                   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┴──────────────┬─────────────────────┐
    │                           │                     │
┌───▼──────┐         ┌─────────▼──┐        ┌────────▼──────┐
│ MongoDB  │         │ Google     │        │  File System  │
│ Database │         │ Gemini API │        │  (Temp Files) │
│          │         │ 2.0-flash  │        │               │
└──────────┘         └────────────┘        └───────────────┘
```

---

## 📊 Database Design

### **1. User Collection**
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed with bcrypt),
  createdAt: Date,
  updatedAt: Date
}
```

### **2. InterviewReport Collection**
```javascript
{
  _id: ObjectId,
  user: ObjectId (reference to User),
  
  // Input Data
  jobDescription: String,
  resumeText: String,
  selfDescription: String,
  
  // AI Generated Analysis
  matchScore: Number (0-100),
  
  technicalQuestions: [{
    question: String,
    intention: String,
    answer: String
  }],
  
  behavioralQuestions: [{
    question: String,
    intention: String,
    answer: String
  }],
  
  skillGaps: [{
    skill: String,
    severity: String (enum: 'low', 'medium', 'high')
  }],
  
  preparationPlans: [{
    day: Number,
    focus: String,
    task: [String]
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

### **3. TokenBlacklist Collection**
```javascript
{
  _id: ObjectId,
  token: String,
  createdAt: Date (TTL index - auto-delete after token expiry)
}
```

---

## 🔌 API Endpoints

### **Authentication Routes** (`/api/auth`)

#### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response (201):
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

#### 2. Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response (200):
{
  "message": "User logged in successfully",
  "user": {
    "id": "user_id",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
Cookie: token=jwt_token_here
```

#### 3. Get Current User
```http
GET /api/auth/get-me
Authorization: Bearer jwt_token OR Cookie: token=jwt_token

Response (200):
{
  "user": {
    "id": "user_id",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

#### 4. Logout User
```http
GET /api/auth/logout
Authorization: Bearer jwt_token OR Cookie: token=jwt_token

Response (200):
{
  "message": "User logged out successfully"
}
```

### **Interview Routes** (`/api/interview`)

#### 1. Generate Interview Report
```http
POST /api/interview/
Content-Type: multipart/form-data
Authorization: Bearer jwt_token

FormData:
  - resume: File (PDF/DOCX - optional)
  - jobDescription: String (required)
  - selfDescription: String (optional, but either resume or selfDescription required)

Response (201):
{
  "message": "Interview report generated successfully",
  "interviewReport": {
    "_id": "report_id",
    "user": "user_id",
    "jobDescription": "...",
    "resumeText": "...",
    "selfDescription": "...",
    "matchScore": 85,
    "technicalQuestions": [...],
    "behavioralQuestions": [...],
    "skillGaps": [...],
    "preparationPlans": [...],
    "createdAt": "2024-05-31T10:00:00.000Z"
  }
}
```

#### 2. Get All Interview Reports (for logged-in user)
```http
GET /api/interview/
Authorization: Bearer jwt_token

Response (200):
{
  "message": "Interview reports retrieved successfully",
  "reports": [
    { ...interviewReport1 },
    { ...interviewReport2 }
  ]
}
```

#### 3. Get Single Interview Report
```http
GET /api/interview/report/:interviewId
Authorization: Bearer jwt_token

Response (200):
{
  "message": "Interview report retrieved successfully",
  "report": { ...interviewReport }
}
```

#### 4. Generate Resume PDF
```http
POST /api/interview/resume/pdf/:interviewReportId
Authorization: Bearer jwt_token

Response (200):
Returns PDF file as binary stream
```

---

## 🎨 Frontend Structure

### **Routes** (`app.routes.jsx`)
```
/                    → Home (Protected) - Interview creation & list
/login               → Login page
/register            → Registration page
/interview/:id       → Interview report details (Protected)
```

### **Features Architecture**

#### **1. Auth Feature** (`/src/features/auth/`)
```
auth/
├── pages/
│   ├── Login.jsx          - Login form & submission
│   └── Register.jsx       - Registration form
├── components/
│   └── Protected.jsx      - Route protection wrapper
├── hooks/
│   └── useAuth.js         - Auth state management hook
├── services/
│   └── auth.api.js        - API calls (register, login, logout, getMe)
├── auth.context.jsx       - AuthContext for global auth state
└── auth.form.scss         - Form styling
```

#### **2. Interview Feature** (`/src/features/interview/`)
```
interview/
├── pages/
│   ├── Home.jsx           - Interview creation form
│   └── Interview.jsx      - Interview report display
├── hooks/
│   └── useInterview.js    - Interview state management
├── services/
│   └── interview.api.js   - API calls for interview operations
├── interview.context.jsx  - InterviewContext for interview state
└── style/
    ├── home.scss          - Home page styling
    └── interview.scss     - Interview details styling
```

#### **3. Common Feature** (`/src/features/common/`)
```
common/
└── ErrorPage.jsx          - Error page for routing errors
```

### **Global State Management**
- **AuthContext**: Manages user authentication state
- **InterviewContext**: Manages interview reports and generation state
- Both wrapped in `App.jsx` for global access

### **Key Frontend Components Flow**
```
App (root)
├── AuthProvider
│   └── InterviewProvider
│       └── RouterProvider
│           ├── /login → Login page
│           ├── /register → Register page
│           └── / → Protected(Home) → Interview creation
│               └── /interview/:id → Interview details
```

---

## 💻 Backend Structure

### **Directory Layout**
```
backend/
├── server.js                    - Entry point, server initialization
├── package.json                 - Dependencies
└── src/
    ├── app.js                   - Express app setup, middleware
    ├── config/
    │   └── database.js          - MongoDB connection
    ├── controllers/
    │   ├── auth.controller.js   - Auth logic
    │   └── interview.controller.js - Interview logic
    ├── middlewares/
    │   ├── auth.middleware.js   - JWT verification
    │   └── file.middleware.js   - File upload (Multer)
    ├── models/
    │   ├── user.model.js        - User schema
    │   ├── interviewReport.model.js - Interview report schema
    │   └── blacklist.model.js   - Token blacklist schema
    ├── routes/
    │   ├── auth.routes.js       - Auth endpoints
    │   └── interview.routes.js  - Interview endpoints
    └── services/
        ├── ai.service.js        - Google Gemini AI integration
        └── temp.js              - Utility functions
```

### **Code Layer Responsibilities**

#### **1. Routes Layer** (Entry points)
- Define HTTP endpoints
- Apply middleware
- Route requests to controllers

#### **2. Middleware Layer** (Cross-cutting concerns)
- **authMiddleware**: Verifies JWT token and adds user to request
- **fileMiddleware**: Handles resume uploads with Multer
- CORS, cookie-parser in app.js

#### **3. Controller Layer** (Business logic orchestration)
- Receives HTTP request
- Calls services for business logic
- Handles response/error
- Validates user input

#### **4. Service Layer** (Business logic)
- **aiService**: Integrates with Google Gemini API
  - `generateInterviewReport()`: Sends prompt to Gemini with Zod validation
  - `generateResumePdf()`: Creates PDF from interview data
- **interviewService**: Interview-specific operations
  - Create, read, update interview reports
  - Calculate metrics

#### **5. Model Layer** (Data persistence)
- Mongoose schemas define data structure
- Models interact with MongoDB
- Pre/post hooks for data transformation

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────┐
│  User Registration / Login              │
└──────────────┬──────────────────────────┘
               │
        POST /api/auth/register OR /login
               │
    ┌──────────▼──────────┐
    │  authController    │
    │  • Validate input   │
    │  • Check if exists  │
    │  • Hash password    │
    │  • Create user      │
    └──────────┬──────────┘
               │
        ┌──────▼──────┐
        │ userModel   │
        │ MongoDB     │
        └──────┬──────┘
               │
    ┌──────────▼──────────┐
    │  JWT Token Created  │
    │  jwt.sign()         │
    │  Expires: 1 day     │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │  Token in Cookie    │
    │  httpOnly: false    │ (Note: Can be improved to true)
    │  Credentials: true  │
    └──────────┬──────────┘
               │
        ┌──────▼──────────┐
        │  Response to    │
        │  Client         │
        └─────────────────┘

─────────────────────────────────────────

┌─────────────────────────────────────────┐
│  Protected Route Access                 │
└──────────────┬──────────────────────────┘
               │
    GET /api/interview (with token in cookie/header)
               │
    ┌──────────▼──────────────┐
    │  authMiddleware         │
    │  • Extract token        │
    │  • Verify JWT signature │
    │  • Check blacklist      │
    │  • Add user to req      │
    └──────────┬──────────────┘
               │
        ┌──────▼──────┐
        │ Controller  │
        │ uses req.   │
        │ user._id    │
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │  Response   │
        └─────────────┘

─────────────────────────────────────────

┌─────────────────────────────────────────┐
│  Logout                                 │
└──────────────┬──────────────────────────┘
               │
    GET /api/auth/logout (with token)
               │
    ┌──────────▼──────────────┐
    │  logoutController       │
    │  • Add token to         │
    │    blacklist collection │
    │  • Clear cookie         │
    └──────────┬──────────────┘
               │
    ┌──────────▼──────────────┐
    │  Token Blacklisted      │
    │  Future requests denied │
    └──────────┬──────────────┘
               │
        ┌──────▼──────┐
        │  Response   │
        │  Success    │
        └─────────────┘
```

---

## 🤖 Interview Generation Flow (Core Business Logic)

```
┌────────────────────────────────────────────┐
│  Frontend: Home.jsx                        │
│  User submits:                             │
│  • Job Description (text)                  │
│  • Self Description (text)                 │
│  • Resume File (PDF/DOCX)                  │
└────────────┬─────────────────────────────┘
             │
     POST /api/interview/
             │
┌────────────▼──────────────────────────────┐
│  authMiddleware (JWT verification)        │
└────────────┬──────────────────────────────┘
             │
┌────────────▼──────────────────────────────┐
│  fileMiddleware (Multer)                   │
│  Resume uploaded to req.file.buffer        │
└────────────┬──────────────────────────────┘
             │
┌────────────▼──────────────────────────────┐
│  interviewController                       │
│  generateInterviewReportController()       │
└────────────┬──────────────────────────────┘
             │
    ┌────────┴──────────────────┐
    │                           │
┌───▼────────┐      ┌──────────▼─────┐
│Parse PDF   │      │Parse DOCX      │
│using       │      │using           │
│pdf-parse   │      │mammoth         │
└───┬────────┘      └──────────┬─────┘
    │                          │
    └────────┬─────────────────┘
             │
┌────────────▼──────────────────────────────┐
│  Extracted Text Variables:                 │
│  • resumeText (from PDF/DOCX)              │
│  • selfDescription (from form)             │
│  • jobDescription (from form)              │
└────────────┬──────────────────────────────┘
             │
┌────────────▼──────────────────────────────┐
│  aiService.generateInterviewReport()       │
│                                            │
│  1. Create Zod schema for validation       │
│  2. Build AI prompt with 3 inputs          │
│  3. Call Google Gemini API 2.0-flash       │
│     - model: "gemini-2.0-flash"            │
│     - responseMimeType: "application/json" │
│     - responseSchema: JSON schema (Zod)    │
│                                            │
│  Response contains:                        │
│  ├── matchScore (0-100)                    │
│  ├── technicalQuestions (5 items)          │
│  ├── behavioralQuestions (5 items)         │
│  ├── skillGaps (array with severity)       │
│  └── preparationPlans (7-day plan)         │
└────────────┬──────────────────────────────┘
             │
┌────────────▼──────────────────────────────┐
│  Validate AI Response                      │
│  (Zod schema validation)                   │
└────────────┬──────────────────────────────┘
             │
┌────────────▼──────────────────────────────┐
│  interviewReportModel.create()             │
│                                            │
│  Save to MongoDB:                          │
│  {                                         │
│    user: req.user.userId,                 │
│    jobDescription,                         │
│    resumeText,                             │
│    selfDescription,                        │
│    matchScore,                             │
│    technicalQuestions,                     │
│    behavioralQuestions,                    │
│    skillGaps,                              │
│    preparationPlans,                       │
│    createdAt,                              │
│    updatedAt                               │
│  }                                         │
└────────────┬──────────────────────────────┘
             │
┌────────────▼──────────────────────────────┐
│  Format Response for Frontend              │
│  - Add aliases for compatibility           │
│  - Normalize field names                   │
└────────────┬──────────────────────────────┘
             │
┌────────────▼──────────────────────────────┐
│  Send 201 Response with Report ID          │
│  {                                         │
│    "_id": "report_id",                     │
│    "message": "Report generated",          │
│    ... full report data ...                │
│  }                                         │
└────────────┬──────────────────────────────┘
             │
┌────────────▼──────────────────────────────┐
│  Frontend: navigate to /interview/:id      │
│  Display report with:                      │
│  • Match score visualization               │
│  • Questions & answers                     │
│  • Skill gaps analysis                     │
│  • 7-day preparation plan                  │
│  • PDF export button                       │
└────────────────────────────────────────────┘
```

---

## ✨ Key Features Implementation

### **1. Resume Parsing**
- **PDF Support**: `pdf-parse` library extracts text from PDF files
- **DOCX Support**: `mammoth` library extracts text from Word documents
- **Fallback**: If file type unknown, attempts PDF parsing
- **Buffer Handling**: Files uploaded to buffer, not disk (security)

### **2. AI Integration (Google Gemini)**
- **Model**: `gemini-2.0-flash` (fastest & cost-effective)
- **Structured Output**: Uses Zod schemas for validated JSON responses
- **Prompt Engineering**: Detailed prompt with all 3 inputs (resume, self, job desc)
- **Schema Validation**: Ensures response matches expected structure

### **3. JWT Authentication**
- **Token Creation**: `jwt.sign()` with 1-day expiry
- **Token Storage**: In HTTP-only cookie (frontend receives but can't access)
- **Token Verification**: Middleware checks token in cookie or Authorization header
- **Logout**: Token blacklisted (added to database, checked before processing)

### **4. Password Security**
- **Hashing**: bcryptjs with salt rounds = 10
- **Comparison**: bcrypt.compare() for secure password matching
- **Never Stored Plain**: Passwords always hashed in database

### **5. File Upload Security**
- **Multer**: Limits file size, checks mime types
- **Buffer Storage**: Files not written to disk during processing
- **Cleanup**: Temporary files cleaned up after parsing

### **6. PDF Generation**
- **PDFKit**: Generates professional PDFs from interview reports
- **Content**: Resume text, job description, AI analysis
- **Download**: Sent as response stream to client

---

## 🔄 Data Flow Summary

### **Authentication Flow**
```
User Form → Frontend API → Backend Controller → User Model → MongoDB
↓
JWT Created → Cookie Set → User State Updated
↓
Protected Routes Accessible
```

### **Interview Generation Flow**
```
User Input (Job Desc + Resume + Self Desc) 
↓
File Upload (if Resume) & Parse
↓
AI Service (Gemini API)
↓
Structured JSON Response with Schema Validation
↓
Save to Database (MongoDB)
↓
Return to Frontend
↓
Display Report & Generate PDF
```

---

## 🚀 How to Run

### **Backend Setup**
```bash
cd backend
npm install
# Create .env file with:
# MONGO_URI=mongodb://...
# JWT_SECRET=your_secret_key
# GOOGLE_GEMINI_API_KEY=your_gemini_key
# PORT=3000
# NODE_ENV=development

npm run dev          # Starts on port 3000
```

### **Frontend Setup**
```bash
cd frontend
npm install
npm run dev          # Starts on port 5173
```

### **Environment Variables Required**

**Backend (.env)**
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/genai-fullstack
JWT_SECRET=your_super_secret_key_here
GOOGLE_GEMINI_API_KEY=your_api_key_here
PORT=3000
NODE_ENV=development
```

**Frontend (auto-configured)**
- Backend URL: `http://localhost:3000`

---

## 📈 Technology Decisions & Trade-offs

| Decision | Why | Trade-off |
|----------|-----|-----------|
| **Express.js** | Lightweight, flexible, large ecosystem | Requires manual setup vs framework like Nest.js |
| **MongoDB** | Flexible schema, JSON-like data | Less ACID compliance than SQL for complex queries |
| **JWT Tokens** | Stateless, scalable, standard | Token can't be instantly revoked (blacklist needed) |
| **Gemini AI** | Cost-effective, fast, supports structured output | Dependent on Google's API availability |
| **React Context API** | Lightweight, no extra dependency | Not ideal for complex state (Redux alternative) |
| **Zod Validation** | Runtime type-safety, beautiful errors | Additional layer of validation vs TypeScript alone |

---

## 🔒 Security Features Implemented

✅ **JWT-based authentication**
✅ **Password hashing with bcryptjs**
✅ **Token blacklisting for logout**
✅ **CORS configured for frontend origin only**
✅ **File upload validation (mime types, size)**
✅ **Unique email/username constraints**
✅ **Protected routes (authMiddleware)**

### **Security Improvements Recommended**

⚠️ **Cookie httpOnly flag**: Currently `false`, should be `true` for production
⚠️ **Secure flag**: Should use `secure: true` in production (HTTPS only)
⚠️ **CSRF protection**: Should add CSRF tokens for state-changing operations
⚠️ **Rate limiting**: Add rate limiting on auth endpoints
⚠️ **Input sanitization**: Sanitize user inputs to prevent injection attacks
⚠️ **API Key protection**: Gemini API key should be in secure environment variables only

---

## 📝 Code Quality Notes

- **Comprehensive Comments**: Code includes JSDoc comments for major functions
- **Error Handling**: Try-catch blocks in async operations
- **Validation**: Zod for AI response validation, manual validation for inputs
- **Middleware Pattern**: Clean separation of concerns
- **Context Pattern**: Global state management without Redux complexity

---

## 🎓 Key Learning Points for Interview

1. **Full-Stack Architecture**: Understand how frontend, backend, database, and AI layers communicate
2. **Authentication**: JWT implementation with token blacklisting for logout
3. **File Handling**: Parsing multiple file formats (PDF, DOCX) from uploads
4. **AI Integration**: Structured prompting with schema validation for reliable AI outputs
5. **Database Design**: Nested schemas in MongoDB for complex data structures
6. **State Management**: React Context API for auth and interview state
7. **API Design**: RESTful endpoints with proper HTTP methods and status codes
8. **Error Handling**: Graceful error management across stack
9. **Security**: Password encryption, JWT tokens, CORS, file validation
10. **Scalability Considerations**: Can add caching, queues for async AI calls, etc.

---

**Created**: May 31, 2026
**Last Updated**: May 31, 2026
**Version**: 1.0
