# GenAI-FullStack: Quick Reference & Cheat Sheet

**Quick Links to Detailed Docs:**
- 📘 [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) - Full architecture, diagrams, data flows
- 💻 [CODE_IMPLEMENTATION_GUIDE.md](./CODE_IMPLEMENTATION_GUIDE.md) - Code walkthrough with snippets
- 🎤 [INTERVIEW_GUIDE.md](./INTERVIEW_GUIDE.md) - Interview talking points & Q&A

---

## 🎯 Project Summary (1 Minute Pitch)

**GenAI-FullStack** is an AI-powered interview preparation platform where users upload resumes and job descriptions, and get personalized interview reports with technical questions, behavioral questions, skill gap analysis, and 7-day study plans using Google Gemini AI.

---

## 🏗️ Architecture at a Glance

```
Frontend (React + Vite)          Backend (Express.js)          Database (MongoDB)
├─ Auth Feature                  ├─ Auth Routes/Controller      ├─ Users
├─ Interview Feature             ├─ Interview Routes/Ctrl       ├─ InterviewReports
├─ Context API (state)           ├─ Middleware (auth, file)     └─ TokenBlacklist
└─ SCSS styling                  ├─ Services (AI, interview)
                                 └─ Models (Mongoose)
                                        ↓
                                Google Gemini API
```

---

## 📦 Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 19.2.6 |
| **Build** | Vite | 8.0.12 |
| **Routing** | React Router DOM | 7.15.0 |
| **HTTP** | Axios | 1.16.1 |
| **Styling** | SASS | 1.99.0 |
| **Backend** | Express.js | 5.2.1 |
| **Runtime** | Node.js | (Latest) |
| **Database** | MongoDB + Mongoose | 9.6.2 |
| **Auth** | JWT | 9.0.3 |
| **Password** | bcryptjs | 3.0.3 |
| **File Upload** | Multer | 2.1.1 |
| **AI** | Google Gemini API | 2.0-flash |
| **Validation** | Zod | 4.4.3 |
| **File Parse** | pdf-parse, mammoth | 2.4.5, 1.12.0 |

---

## 🔌 API Endpoints Quick Ref

### **Authentication**
```
POST   /api/auth/register      → Create user account
POST   /api/auth/login         → Login & get JWT token
GET    /api/auth/logout        → Logout & blacklist token
GET    /api/auth/get-me        → Get current user (protected)
```

### **Interview**
```
POST   /api/interview/                     → Generate report (protected, with file upload)
GET    /api/interview/                     → Get all reports (protected)
GET    /api/interview/report/:interviewId  → Get single report (protected)
POST   /api/interview/resume/pdf/:id       → Download PDF (protected)
```

---

## 📊 Database Schema Quick Ref

### **Users Collection**
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (bcrypt hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### **InterviewReports Collection**
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref Users),
  jobDescription: String,
  resumeText: String,
  selfDescription: String,
  matchScore: Number (0-100),
  technicalQuestions: [{question, intention, answer}],
  behavioralQuestions: [{question, intention, answer}],
  skillGaps: [{skill, severity: 'low'|'medium'|'high'}],
  preparationPlans: [{day: Number, focus: String, task: [String]}],
  createdAt: Date,
  updatedAt: Date
}
```

### **TokenBlacklist Collection**
```javascript
{
  _id: ObjectId,
  token: String (unique),
  createdAt: Date (TTL: 86400s auto-delete)
}
```

---

## 🔐 Authentication Flow (Quick)

```
Register/Login → Hash Password (bcrypt) → Create JWT (1 day expiry)
                                              ↓
                                        Set in Cookie
                                              ↓
                          Protected Routes: Extract token → Verify JWT
                                              ↓
                                        Check Blacklist
                                              ↓
                                        Add user to req
                                              ↓
Logout → Add token to Blacklist → Future requests rejected
```

---

## 🤖 AI Integration (Quick)

```
User Input (resume + job desc + self desc)
        ↓
Build Prompt (detailed with all 3 inputs)
        ↓
Call Gemini API with Zod Schema
        ↓
AI enforces schema → Returns valid JSON
        ↓
Parse & validate response
        ↓
Save to MongoDB
        ↓
Return to frontend
```

---

## 🎨 Frontend Flow (Quick)

```
User Form (Home.jsx)
    ↓
Validate input
    ↓
Create FormData (for file)
    ↓
Call interview.api.generateReport()
    ↓
POST with JWT cookie
    ↓
Get report with _id
    ↓
Navigate to /interview/:id
    ↓
Display analysis & prepare PDF button
```

---

## 📁 Project Structure (Quick Reference)

```
backend/
├── server.js                          (Entry point)
└── src/
    ├── app.js                         (Express setup)
    ├── config/database.js             (MongoDB connection)
    ├── controllers/
    │   ├── auth.controller.js         (Auth logic)
    │   └── interview.controller.js    (Interview logic)
    ├── middlewares/
    │   ├── auth.middleware.js         (JWT verification)
    │   └── file.middleware.js         (Multer)
    ├── models/
    │   ├── user.model.js              (User schema)
    │   ├── interviewReport.model.js   (Report schema)
    │   └── blacklist.model.js         (Blacklist schema)
    ├── routes/
    │   ├── auth.routes.js             (Auth endpoints)
    │   └── interview.routes.js        (Interview endpoints)
    └── services/
        └── ai.service.js              (Gemini integration)

frontend/
├── src/
│   ├── App.jsx                        (Root with providers)
│   ├── app.routes.jsx                 (Route definitions)
│   ├── main.jsx                       (Entry point)
│   ├── features/
│   │   ├── auth/
│   │   │   ├── pages/ (Login, Register)
│   │   │   ├── components/ (Protected)
│   │   │   ├── hooks/ (useAuth)
│   │   │   ├── services/ (auth.api.js)
│   │   │   └── auth.context.jsx
│   │   ├── interview/
│   │   │   ├── pages/ (Home, Interview)
│   │   │   ├── hooks/ (useInterview)
│   │   │   ├── services/ (interview.api.js)
│   │   │   ├── interview.context.jsx
│   │   │   └── style/
│   │   └── common/ (ErrorPage)
│   └── style/
└── vite.config.js
```

---

## 🔒 Security Checklist

✅ JWT authentication
✅ Password hashing (bcryptjs)
✅ Token blacklisting
✅ CORS configured
✅ File upload validation
✅ Unique email/username constraints
✅ Protected routes (middleware)
✅ Same error message for privacy

⚠️ **Should improve:**
- httpOnly flag on cookies
- Secure flag for HTTPS
- CSRF protection
- Rate limiting
- Input sanitization
- Request logging

---

## 💡 Key Design Decisions & Why

| Decision | Why | Trade-off |
|----------|-----|-----------|
| JWT + Blacklist | Stateless auth, easier to scale | Can't instant revoke (blacklist overhead) |
| MongoDB | Schema flexibility, JSON-like docs | Less ACID than SQL |
| React Context | Lightweight, no extra dependencies | All consumers re-render on state change |
| Gemini API | Cost-effective, schema support | Depends on Google availability |
| Memory storage | Fast, secure (no disk write) | Limited by RAM |
| Express.js | Lightweight, flexible | Less opinionated than frameworks |
| Zod validation | Runtime type safety, great errors | Extra parsing layer |

---

## 🚀 How to Explain to ChatGPT

**Copy-paste this:**

```
I built an AI-powered interview prep platform called GenAI-FullStack. Here's the tech:

BACKEND:
- Node.js + Express.js
- MongoDB + Mongoose
- JWT authentication with token blacklisting
- File parsing (PDF with pdf-parse, DOCX with mammoth)
- Google Gemini API integration with Zod schemas for structured outputs

FRONTEND:
- React 19 + Vite
- React Router for navigation
- React Context API for state (AuthContext, InterviewContext)
- Axios for API calls
- SASS for styling

KEY FLOW:
1. User registers/login → JWT token in cookie
2. User submits job description + resume
3. Backend parses resume (PDF/DOCX → text)
4. Calls Gemini AI with Zod-validated schema
5. Saves report to MongoDB
6. Returns to frontend for display
7. Can generate PDF of report

FEATURES:
- User authentication with JWT
- Resume parsing (PDF & DOCX)
- AI-generated interview questions (technical & behavioral)
- Skill gap analysis
- 7-day preparation plan
- PDF export

ARCHITECTURE:
MVC pattern with service layer. Context API for frontend state. Mongoose for ODM. Express middleware for auth and file upload. Schema-driven AI responses.

Can you explain to me how to improve this architecture for production?
```

---

## 📚 Documentation Files in This Project

| File | Purpose | Length |
|------|---------|--------|
| **SYSTEM_ARCHITECTURE.md** | Complete system design, data flows, API docs | ~800 lines |
| **CODE_IMPLEMENTATION_GUIDE.md** | Detailed code walkthrough with all snippets | ~900 lines |
| **INTERVIEW_GUIDE.md** | Interview prep, talking points, common Q&A | ~600 lines |
| **README.md** (Quick Ref) | This file - quick lookup | ~300 lines |

---

## 🎯 When to Reference Each Doc

| Situation | Document |
|-----------|----------|
| "Explain the architecture" | SYSTEM_ARCHITECTURE.md |
| "Show me the actual code" | CODE_IMPLEMENTATION_GUIDE.md |
| "Interview in 30 mins" | INTERVIEW_GUIDE.md |
| "Quick lookup of endpoints" | Quick reference (this file) |
| "Showing to recruiter" | All three + project demo |

---

## 💬 Common Interview Phrases to Use

**"I chose X technology because..."**
- Express because lightweight and flexible
- MongoDB because schema flexibility for evolving data
- React Context because simple and no external dependency
- Gemini because cost-effective and supports structured outputs

**"The key technical decision was..."**
- Using Zod schemas for schema-driven AI generation
- Implementing token blacklist for logout
- Memory storage for file processing (fast, secure)
- Separating concerns with service layer

**"To improve scalability, I would..."**
- Add Redis caching
- Implement database indexes
- Use request queuing for AI calls
- Add load balancing
- Implement microservices

**"For security, I implemented..."**
- JWT with 1-day expiry
- Bcryptjs password hashing
- Token blacklisting on logout
- CORS configuration
- File upload validation

---

## ⚡ Performance Tips You've Used

✅ Memory storage over disk
✅ Async/await for non-blocking I/O
✅ JWT for stateless auth (no session lookups)
✅ Vite for fast builds
✅ Context API (good for moderate state)

---

## 🔍 Testing Ideas (Mention in Interview)

```javascript
// Unit Tests
- Test password hashing
- Test JWT token creation/verification
- Test file parsing
- Test schema validation

// Integration Tests
- Test registration → login flow
- Test file upload → parsing → AI call
- Test protected route access
- Test logout → token blacklisted

// E2E Tests
- Test full user journey (register → create report → download PDF)
- Test error cases
- Test edge cases (invalid file, timeout, etc.)

// Performance Tests
- Load testing with k6/Artillery
- Database indexing performance
- API response times
```

---

## 📝 100-Word Summary (Memorize This!)

"GenAI-FullStack is a full-stack AI-powered interview preparation platform. Built with React on the frontend using Vite and Context API for state, and Express.js on the backend with MongoDB for storage. Users authenticate via JWT tokens with blacklisting for logout, then submit job descriptions and resumes. The backend parses resumes (PDF/DOCX), integrates with Google's Gemini AI using Zod schemas for guaranteed valid responses, and generates personalized interview reports with technical questions, behavioral questions, skill gaps, and 7-day prep plans. The key innovation is using schema-driven AI generation for consistent, validated results."

---

## 🎓 What This Project Shows Employers

✅ Full-stack development (frontend, backend, database, AI)
✅ Modern tooling (Vite, React, Node.js)
✅ Authentication & security (JWT, bcrypt, blacklisting)
✅ API integration (Google Gemini)
✅ File processing (multi-format parsing)
✅ Database design (schema, relationships)
✅ State management (Context API)
✅ Error handling
✅ API design (RESTful)
✅ Technical decision-making
✅ Problem-solving (schema-driven AI)

---

**Created: May 31, 2026**
**For: GenAI-FullStack Project**
**Purpose: Interview preparation & code documentation**

---

## Next Steps

1. **Review** all three documents (30 mins)
2. **Practice** explaining the project (1 hour)
3. **Prepare** 2-minute pitch (15 mins)
4. **Answer** common questions (30 mins)
5. **Share** with ChatGPT or interviewer (copy-paste the ChatGPT section)

**Good luck! 🚀**
