# 🎓 CampusNav – Smart College Navigation System

> A modern AI-powered College Navigation Platform that helps students, faculty, visitors, and administrators quickly locate campus facilities, faculty cabins, labs, offices, and departments through intelligent search and voice-assisted navigation.

---

# 🌐 Project Overview

Finding locations inside a large college campus can be frustrating for:

- New Students
- Parents
- Visitors
- Faculty Members
- Administrative Staff

Students often spend valuable time searching for:

- Faculty Cabins
- HOD Offices
- Labs
- Classrooms
- Placement Cell
- Library
- Canteen
- Administrative Offices

CampusNav solves this problem by providing a centralized intelligent navigation system.

---

# 🚨 Problem Statement

| Problem | Impact |
|----------|---------|
| Students cannot find faculty cabins | Wasted time |
| New students get lost | Confusion |
| Visitors struggle to navigate | Poor experience |
| Information is scattered | Inefficiency |
| Manual inquiries required | Increased workload |

---

# ✅ Proposed Solution

CampusNav provides:

- Smart Search Engine
- AI-Based Query Understanding
- Voice Search
- Faculty & Location Directory
- Secure Admin Panel
- Real-Time Location Management

---

# 🏗 System Architecture

```text
┌───────────────────────┐
│       Frontend        │
│ HTML + CSS + JS       │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│     Express Server    │
│       Node.js         │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│     MongoDB Atlas     │
│   Location Database   │
└───────────────────────┘
```

---

# 🔄 System Flow

```text
User Search
      │
      ▼
Unified Search Bar
      │
      ▼
AI Processing
      │
      ├── Keyword Search
      │
      ├── Fuzzy Matching
      │
      └── Natural Language Processing
      │
      ▼
Best Matching Locations
      │
      ▼
Result Cards
```

---

# 🎤 Voice Search Flow

```text
User Clicks Mic
       │
       ▼
Web Speech API
       │
       ▼
Voice Converted To Text
       │
       ▼
Search Input Auto Filled
       │
       ▼
Search Triggered Automatically
       │
       ▼
Results Displayed
```

---

# 🤖 AI Search Flow

```text
User Query
      │
      ▼
Unified Search Engine
      │
      ├── Exact Match
      ├── Fuzzy Match
      ├── Synonym Match
      └── NLP Intent Detection
      │
      ▼
Best Matching Location
      │
      ▼
Result Card
```

Examples:

```text
Dr Ravi Kumar
```

```text
Where is HOD CSE?
```

```text
I want to visit the canteen
```

```text
Find Placement Cell
```

---

# 👨‍💼 Admin Panel Flow

```text
Admin Login
      │
      ▼
JWT Authentication
      │
      ▼
Authorized Dashboard
      │
      ├── Add Location
      ├── Edit Location
      ├── Delete Location
      └── View Locations
```

---

# 🔐 Authentication Architecture

```text
Username + Password
          │
          ▼
Bcrypt Verification
          │
          ▼
JWT Token Generated
          │
          ▼
Stored In Browser
          │
          ▼
Protected API Access
```

---

# ✨ Key Features

## 🔍 Smart Unified Search

Search by:

- Faculty Name
- Lab Name
- Office Name
- Facility Name
- Department Name

Examples:

```text
Dr Sharma
AI Lab
Placement Cell
Library
```

---

## 🤖 AI-Powered Search

Natural Language Queries:

```text
Where is HOD CSE?
Take me to AI Lab
I want to visit the canteen
```

---

## 🎤 Voice Search

- Web Speech API
- One-click voice input
- Auto-search after speaking
- Modern microphone UI

---

## 🧑‍💼 Secure Admin Panel

Only authorized personnel can:

- Add Locations
- Update Locations
- Delete Locations
- Manage Database Entries

---

## 🔒 JWT Authentication

Features:

- Login Protection
- Token Validation
- Route Security
- Session Management

---

## 📍 Smart Location Cards

Each location contains:

- Name
- Room Number
- Floor
- Block
- Department
- Description

---

## 🌗 Dark / Light Mode

Features:

- Theme Toggle
- Persistent Preference
- LocalStorage Support

---

## 🎨 Modern UI

Features:

- Responsive Design
- Glassmorphism Effects
- Smooth Animations
- Mobile Friendly

---

# 🗂 Database Schema

## Location Collection

```javascript
{
  name: String,
  type: String,
  room: String,
  floor: String,
  block: String,
  department: String,
  keywords: [String],
  description: String
}
```

---

## Admin Collection

```javascript
{
  username: String,
  password: String
}
```

Password is encrypted using:

```text
bcryptjs
```

---

# 🛠 Tech Stack

## Frontend

| Technology | Purpose |
|------------|----------|
| HTML5 | Structure |
| CSS3 | Styling |
| JavaScript | Logic |

---

## Backend

| Technology | Purpose |
|------------|----------|
| Node.js | Runtime |
| Express.js | API Server |

---

## Database

| Technology | Purpose |
|------------|----------|
| MongoDB Atlas | Cloud Database |
| Mongoose | ODM |

---

## Security

| Technology | Purpose |
|------------|----------|
| JWT | Authentication |
| bcryptjs | Password Hashing |

---

## AI Search

| Technology | Purpose |
|------------|----------|
| Fuse.js | Fuzzy Search |
| Custom NLP Logic | Intent Detection |

---

## Voice Search

| Technology | Purpose |
|------------|----------|
| Web Speech API | Speech Recognition |

---

# 📁 Project Structure

```text
CampusNav/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── authController.js
│   ├── locationController.js
│   └── aiController.js
│
├── middleware/
│   └── authMiddleware.js
│
├── models/
│   ├── Admin.js
│   └── Location.js
│
├── routes/
│   ├── authRoutes.js
│   ├── locationRoutes.js
│   └── aiRoutes.js
│
├── public/
│   ├── assets/
│   ├── css/
│   ├── js/
│   ├── index.html
│   └── admin.html
│
├── seed/
│
├── server.js
├── package.json
└── README.md
```

---

# 📊 Feature Comparison

| Feature | Traditional Campus | CampusNav |
|----------|----------|----------|
| Manual Inquiry | ✅ | ❌ |
| Smart Search | ❌ | ✅ |
| Voice Search | ❌ | ✅ |
| AI Search | ❌ | ✅ |
| Secure Admin Panel | ❌ | ✅ |
| Mobile Friendly | ❌ | ✅ |
| Dark Mode | ❌ | ✅ |

---

# 🚀 Future Enhancements

## Phase 2

- Indoor Route Navigation
- Interactive Campus Map
- QR Based Navigation
- Department Wise Search
- Multi-language Support

## Phase 3

- AI Chatbot
- Real-Time Navigation
- Student Dashboard
- Timetable Integration
- Faculty Availability Status

---

# 📸 Screenshots

Add screenshots after deployment:

```text
Home Page

Search Results

Voice Search

Admin Login

Admin Dashboard
```

---

# 🧪 Local Setup

## Clone Repository

```bash
git clone https://github.com/sumit-codes4123/CampusNav.git
```

## Install Dependencies

```bash
npm install
```

## Configure Environment

Create `.env`

```env
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
PORT=5000
```

## Run Server

```bash
npm start
```

---

# 🌍 Deployment

## Frontend

- Vercel

## Backend

- Render
- Railway
- VPS

## Database

- MongoDB Atlas

---

# 👨‍💻 Developer

**Sumit**

B.Tech CSE

GitHub:

```text
https://github.com/sumit-codes4123
```

---

# ⭐ CampusNav

> Smart • Fast • AI-Powered Campus Navigation

Helping students find destinations, not directions. 🚀