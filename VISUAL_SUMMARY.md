# GenAI-FullStack: Visual Summary & Diagrams

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GENAI-FULLSTACK APPLICATION                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────┐         ┌────────────────────────────┐  │
│  │    FRONTEND (React + Vite)   │         │   BACKEND (Express.js)     │  │
│  │                              │         │                            │  │
│  │ ┌──────────────────────────┐ │         │ ┌──────────────────────┐  │  │
│  │ │  AuthContext             │ │         │ │ Auth Routes/Ctrl    │  │  │
│  │ │  ├─ user                 │ │         │ │ ├─ register()       │  │  │
│  │ │  ├─ loading              │ │         │ │ ├─ login()          │  │  │
│  │ │  ├─ handleLogin()        │ │         │ │ ├─ logout()         │  │  │
│  │ │  └─ handleRegister()     │ │         │ │ └─ getMe()          │  │  │
│  │ └──────────────────────────┘ │         │ └──────────────────────┘  │  │
│  │                              │         │                            │  │
│  │ ┌──────────────────────────┐ │         │ ┌──────────────────────┐  │  │
│  │ │  InterviewContext        │ │         │ │ Interview Routes/Ctrl│  │  │
│  │ │  ├─ reports              │ │         │ │ ├─ generate()       │  │  │
│  │ │  ├─ generateReport()     │ │         │ │ ├─ getAll()         │  │  │
│  │ │  └─ fetchReports()       │ │         │ │ ├─ getById()        │  │  │
│  │ └──────────────────────────┘ │         │ │ └─ generatePdf()    │  │  │
│  │                              │         │ └──────────────────────┘  │  │
│  │ Pages:                       │         │                            │  │
│  │ ├─ Login                     │         │ Middleware:                │  │
│  │ ├─ Register                  │         │ ├─ authMiddleware          │  │
│  │ ├─ Home (Interview form)     │    ┌────► ├─ fileMiddleware        │  │
│  │ ├─ Interview Details         │    │    │ └─ CORS, CookieParser    │  │
│  │ └─ Error Page                │    │    │                            │  │
│  │                              │    │    │ Services:                 │  │
│  │ Styling: SCSS               │    │    │ ├─ aiService.js          │  │
│  └──────────────────────────────┘    │    │ └─ (business logic)      │  │
│                                       │    │                            │  │
│  Axios Calls ──────────────────────────┼───► Models (Mongoose):       │  │
│  baseURL: http://localhost:3000       │    │ ├─ User                 │  │
│  credentials: true                    │    │ ├─ InterviewReport      │  │
│                                       │    │ └─ TokenBlacklist       │  │
│                                       │    │                            │  │
│                                       │    └────────────────────────────┘  │
│                                       │                                     │
└───────────────────────────────────────┼─────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
            ┌───────▼──────┐   ┌────────▼────────┐   ┌────▼──────────┐
            │  MongoDB     │   │  Google Gemini  │   │  File System  │
            │              │   │  API 2.0-flash  │   │  (Temp)       │
            │  Collections:│   │                 │   │               │
            │  ├─ Users    │   │ Takes:          │   │  Resume       │
            │  ├─ Interview│   │ ├─ Job desc    │   │  parsing      │
            │  │  Reports  │   │ ├─ Resume text │   │               │
            │  └─ Token    │   │ └─ Self desc   │   │  PDF/DOCX     │
            │    Blacklist │   │                 │   │  → text       │
            └──────────────┘   │ Returns:        │   │               │
                               │ ├─ Match score │   │               │
                               │ ├─ Questions  │   │               │
                               │ ├─ Gaps       │   │               │
                               │ └─ Plan       │   │               │
                               │                 │   │               │
                               │ Zod Schema      │   │               │
                               │ validates!      │   │               │
                               └─────────────────┘   └───────────────┘
```

---

## 🔄 Complete User Journey Flow

```
                              ┌─ REGISTRATION PATH ─┐
                              │                      │
                              ▼                      ▼
                         [Register]            [Login]
                              │                      │
                    Input: username,          Input: email,
                    email, password           password
                              │                      │
                              ├────────┬─────────────┤
                                       │
                                       ▼
                          Validate input, Hash password
                          Check unique constraints
                                       │
                                       ├─ Error? → Return 400
                                       │
                                       ▼
                          Create user in MongoDB
                                       │
                                       ├─ Error? → Return 500
                                       │
                                       ▼
                    Generate JWT token (expires 1 day)
                                       │
                                       ▼
                    Set token in HTTP cookie
                                       │
                                       ▼
                         Return user object to frontend
                                       │
                                       ▼
                              Update Context (user logged in)
                                       │
                                       ▼
                    ┌─────────────── AUTHENTICATED ────────────┐
                    │                                           │
                    ▼                                           ▼
            [Create Interview]                        [Logout]
            (Home page)                               │
                    │                                 ▼
        ┌───────────┼───────────┐         Add token to blacklist
        │           │           │         Clear cookie
        ▼           ▼           ▼         │
    Input:      Resume      Validate:    ▼
    ├─ Job      Upload      Need job desc + 
    │  desc     (optional)   (resume OR self desc)
    ├─ Self                      │
    │  desc                      ├─ Valid? Continue
    └─ Resume               │
    (or none)               ├─ Invalid? → Return 400
                            │
                            ▼
                   Parse Resume (if exists)
                   ├─ PDF → pdf-parse
                   ├─ DOCX → mammoth
                   └─ Extract text
                            │
                            ▼
        Call AI Service (aiService.js)
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
    Send to Gemini API        Send Zod Schema
    Prompt includes:          Ensures response matches:
    ├─ Job description        ├─ matchScore (0-100)
    ├─ Resume text            ├─ technicalQuestions (5)
    └─ Self description       ├─ behavioralQuestions (5)
                              ├─ skillGaps []
                              └─ preparationPlans [7 days]
                            │
                            ├─ Validation error? → throw
                            │
                            ▼
                    Parse JSON response
                            │
                            ▼
    Save to MongoDB (interviewReportModel.create)
                            │
                            ├─ Error? → Return 500
                            │
                            ▼
                    Return report with _id
                            │
                            ▼
                    Frontend navigates to
                    /interview/:id
                            │
                            ▼
        ┌───────────────────┬──────────────────┐
        │                   │                  │
        ▼                   ▼                  ▼
    Display match     Show questions      Generate PDF
    score visualization  with answers      Button
        │                   │                  │
        └───────────────────┴──────────────────┘
```

---

## 🔐 Authentication & Authorization Flow

```
REGISTRATION/LOGIN
        │
        ├─ POST /api/auth/register or /login
        │
        ▼
    authController
        │
        ├─ Validate input
        ├─ Check if user exists (for register)
        ├─ bcrypt.hash() password
        ├─ Create/Find user in MongoDB
        │
        ▼
    Create JWT Token
        │
        ├─ jwt.sign({ userId: user._id }, SECRET, { expiresIn: '1d' })
        │
        ▼
    Set Cookie with token
        │
        ├─ res.cookie("token", jwtToken)
        │
        ▼
    Send response with user object

═══════════════════════════════════════════════════════════

PROTECTED ROUTE ACCESS (Using middleware)
        │
        ├─ Request with cookie or Authorization header
        │
        ▼
    authMiddleware.authUser
        │
        ├─ Extract token from:
        │  ├─ req.cookies.token (from cookie)
        │  └─ req.headers.authorization?.split(" ")[1] (from header)
        │
        ├─ No token? → 401 "No token provided"
        │
        ├─ Check if token in blacklist
        │  └─ Yes? → 401 "Token is invalid"
        │
        ├─ Verify JWT signature
        │  └─ jwt.verify(token, SECRET)
        │
        ├─ Invalid? → 401 "Invalid token"
        │
        ▼
    Add decoded user to req object
        │
        └─ req.user = { userId: "...", iat, exp }
        │
        ▼
    Call next() → Controller proceeds

═══════════════════════════════════════════════════════════

LOGOUT
        │
        ├─ GET /api/auth/logout (with token)
        │
        ▼
    logoutController
        │
        ├─ Add token to blacklist collection
        │  └─ TokenBlacklist.create({ token })
        │
        ├─ TTL index auto-deletes after 24h
        │
        ├─ Clear cookie on client
        │
        ▼
    Response: "Logged out successfully"

FUTURE REQUESTS WITH BLACKLISTED TOKEN
        │
        ├─ authMiddleware checks blacklist
        │
        ├─ Found in blacklist? 
        │  └─ Yes → 401 "Token is invalid"
        │
        └─ Request rejected
```

---

## 📝 Data Flow: Interview Report Generation

```
USER SUBMITS FORM
    │
    └─ { jobDescription, selfDescription, resumeFile }
        │
        ▼
    FRONTEND: Interview Feature
        │
        ├─ Validate input
        ├─ Create FormData()
        ├─ Append jobDescription, selfDescription, resume file
        │
        ▼
    API CALL
        │
        └─ POST /api/interview/
           Headers: Cookie: token=jwt_token
           Body: FormData
        │
        ▼
    BACKEND: Express Router
        │
        └─ Route matched: POST /api/interview/
        │
        ▼
    MIDDLEWARE STACK
        │
        ├─ authMiddleware.authUser
        │  └─ Verify JWT, check blacklist, add user to req
        │
        ├─ fileMiddleware (upload.single("resume"))
        │  └─ Extract resume to req.file.buffer
        │  └─ Validate mime type, size
        │
        ▼
    CONTROLLER: generateInterviewReportController
        │
        ├─ Extract from request:
        │  ├─ req.body.jobDescription
        │  ├─ req.body.selfDescription
        │  ├─ req.file.buffer (resume)
        │  └─ req.user._id (from middleware)
        │
        ▼
    PARSE RESUME
        │
        ├─ If file exists, check mimetype:
        │
        ├─ If PDF → await pdfParse(req.file.buffer)
        │  └─ resumeText = data.text
        │
        ├─ If DOCX → await mammoth.extractRawText()
        │  └─ resumeText = result.value
        │
        ├─ If error → resumeText = ""
        │
        ▼
    VALIDATE
        │
        ├─ jobDescription required
        ├─ resumeText OR selfDescription required
        │
        ├─ If missing → Return 400
        │
        ▼
    CALL AI SERVICE
        │
        └─ aiService.generateInterviewReport({
             resume: resumeText,
             selfDescription,
             jobDescription
           })
        │
        ▼
    AI SERVICE
        │
        ├─ Build detailed prompt with all 3 inputs
        │
        ├─ Create Zod schema defining response structure:
        │  ├─ matchScore: number (0-100)
        │  ├─ technicalQuestions: [{ question, intention, answer }]
        │  ├─ behavioralQuestions: [{ question, intention, answer }]
        │  ├─ skillGaps: [{ skill, severity }]
        │  └─ preparationPlans: [{ day, focus, task }]
        │
        ├─ Convert Zod schema to JSON schema
        │
        ├─ Call Google Gemini API:
        │  ├─ model: "gemini-2.0-flash"
        │  ├─ contents: prompt
        │  ├─ responseMimeType: "application/json"
        │  └─ responseSchema: jsonSchema
        │
        ├─ Gemini enforces schema → Always valid JSON
        │
        ├─ Parse response.text as JSON
        │
        ▼
    VALIDATE RESPONSE
        │
        ├─ Schema validation (already enforced by Gemini)
        ├─ Type checking (all fields present)
        │
        ├─ Error handling:
        │  ├─ Timeout? → Return 500
        │  ├─ Invalid JSON? → Return 500
        │  └─ API error? → Return 500
        │
        ▼
    SAVE TO DATABASE
        │
        └─ interviewReportModel.create({
             user: req.user._id,
             jobDescription,
             resumeText,
             selfDescription,
             ...aiResponse // matchScore, questions, gaps, plans
           })
        │
        ▼
    FORMAT RESPONSE
        │
        ├─ Add aliases for frontend compatibility
        ├─ Normalize field names
        ├─ Convert toObject() for JSON serialization
        │
        ▼
    SEND RESPONSE
        │
        └─ 201 Created
           {
             "message": "Interview report generated successfully",
             "interviewReport": {
               "_id": "report_id",
               "user": "user_id",
               "jobDescription": "...",
               "matchScore": 85,
               "technicalQuestions": [...],
               "behavioralQuestions": [...],
               "skillGaps": [...],
               "preparationPlans": [...],
               "createdAt": "2024-05-31...",
               "updatedAt": "2024-05-31..."
             }
           }
        │
        ▼
    FRONTEND RECEIVES
        │
        ├─ Extract report._id
        ├─ Update InterviewContext with report
        ├─ Navigate to /interview/:id
        │
        ▼
    DISPLAY REPORT
        │
        ├─ Show match score (visualization)
        ├─ Show technical questions with answers
        ├─ Show behavioral questions with answers
        ├─ Show skill gaps sorted by severity
        ├─ Show 7-day preparation plan
        └─ Show "Generate PDF" button
```

---

## 🗄️ Database Schema Visualization

```
USERS COLLECTION
┌─────────────────────────────────────────┐
│ _id: ObjectId                           │
│ username: String (unique)               │
│ email: String (unique)                  │
│ password: String (bcrypt hashed)        │
│ createdAt: Date (auto)                  │
│ updatedAt: Date (auto)                  │
└─────────────────────────────────────────┘
          │
          │ (referenced by)
          │
          ▼
INTERVIEWREPORTS COLLECTION
┌─────────────────────────────────────────┐
│ _id: ObjectId                           │
│ user: ObjectId → Users._id              │ (Foreign Key)
│ jobDescription: String                  │
│ resumeText: String                      │
│ selfDescription: String                 │
│ matchScore: Number (0-100)              │
│                                         │
│ technicalQuestions: [{                  │
│   question: String                      │
│   intention: String                     │
│   answer: String                        │
│   _id: false                            │ (no ID for subdocs)
│ }]  (5 items)                           │
│                                         │
│ behavioralQuestions: [{                 │
│   question: String                      │
│   intention: String                     │
│   answer: String                        │
│   _id: false                            │
│ }]  (5 items)                           │
│                                         │
│ skillGaps: [{                           │
│   skill: String                         │
│   severity: String (enum)               │ ('low'|'medium'|'high')
│   _id: false                            │
│ }]                                      │
│                                         │
│ preparationPlans: [{                    │
│   day: Number                           │ (1-7)
│   focus: String                         │ (topic for day)
│   task: [String]                        │ (array of tasks)
│   _id: false                            │
│ }]  (7 days)                            │
│                                         │
│ createdAt: Date (auto)                  │
│ updatedAt: Date (auto)                  │
└─────────────────────────────────────────┘

TOKENBLACKLIST COLLECTION
┌─────────────────────────────────────────┐
│ _id: ObjectId                           │
│ token: String (unique)                  │
│ createdAt: Date (auto)                  │
│   └─ TTL Index: expires=86400 (1 day)   │ (auto-delete)
└─────────────────────────────────────────┘
```

---

## 🔌 API Request/Response Examples

### **Register Request**
```http
POST /api/auth/register HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

HTTP/1.1 201 Created
Set-Cookie: token=eyJhbGc...; Path=/

{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### **Generate Report Request**
```http
POST /api/interview/ HTTP/1.1
Host: localhost:3000
Cookie: token=eyJhbGc...
Content-Type: multipart/form-data; boundary=----

------
Content-Disposition: form-data; name="jobDescription"

Senior React Developer needed...
------
Content-Disposition: form-data; name="selfDescription"

I have 5 years of React experience...
------
Content-Disposition: form-data; name="resume"; filename="resume.pdf"
Content-Type: application/pdf

[PDF BINARY DATA]
------

HTTP/1.1 201 Created

{
  "message": "Interview report generated successfully",
  "interviewReport": {
    "_id": "507f1f77bcf86cd799439011",
    "matchScore": 85,
    "technicalQuestions": [
      {
        "question": "What is React Context API?",
        "intention": "Assess knowledge of state management",
        "answer": "Context API is..."
      }
      // ... 4 more
    ],
    "behavioralQuestions": [...],
    "skillGaps": [...],
    "preparationPlans": [...]
  }
}
```

---

## 🎯 State Management Flow (React)

```
App.jsx
   │
   ├─ AuthProvider (wraps everything)
   │  │
   │  ├─ State:
   │  │  ├─ user: { id, username, email } | null
   │  │  ├─ loading: boolean
   │  │  └─ error: string | null
   │  │
   │  └─ Methods:
   │     ├─ handleRegister(credentials)
   │     ├─ handleLogin(credentials)
   │     ├─ handleLogout()
   │     └─ checkAuth()
   │
   ├─ InterviewProvider
   │  │
   │  ├─ State:
   │  │  ├─ reports: [{ _id, matchScore, ... }]
   │  │  ├─ loading: boolean
   │  │  └─ error: string | null
   │  │
   │  └─ Methods:
   │     ├─ generateReport(data)
   │     ├─ fetchReports()
   │     └─ fetchReportById(id)
   │
   └─ RouterProvider
      │
      ├─ /login → Login.jsx
      │           └─ useAuth() → handleLogin()
      │
      ├─ /register → Register.jsx
      │              └─ useAuth() → handleRegister()
      │
      └─ / → Protected
             ├─ useAuth() → check if logged in
             │
             └─ Home.jsx
                ├─ useAuth() → user info
                └─ useInterview() → generateReport()
```

---

## 🚀 Environment Variables Checklist

```
BACKEND (.env)
───────────────────────────────
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/genai-fullstack
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
NODE_ENV=development

FRONTEND (vite.config.js)
───────────────────────────────
const API_BASE_URL = "http://localhost:3000"
```

---

## 📋 Pre-Interview Checklist

```
✓ Understand the flow (user registration → report generation)
✓ Explain tech choices (why React, Express, MongoDB, Gemini)
✓ Discuss authentication (JWT, bcrypt, blacklist)
✓ Explain AI integration (Zod schemas, structured output)
✓ Describe file parsing (PDF, DOCX, error handling)
✓ Discuss database design (nested schemas, references)
✓ Talk about security (password hashing, CORS, validation)
✓ Mention improvements (httpOnly cookies, CSRF, rate limiting)
✓ Prepare scalability ideas (caching, queuing, indexing)
✓ Practice 30-second pitch
✓ Practice 2-minute explanation
✓ Have architecture diagram ready
✓ Reference docs available
```

---

**Diagrams Created:**
- ✅ System Architecture (Detailed)
- ✅ Complete User Journey
- ✅ Authentication Flow
- ✅ Interview Generation Data Flow
- ✅ Database Schema
- ✅ API Examples
- ✅ React State Management

**All documentation ready for interviews! 🚀**
