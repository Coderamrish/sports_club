<div align="center">

<br/>

```
███████╗██████╗  ██████╗ ██████╗ ████████╗███████╗██╗  ██╗██╗   ██╗██████╗
██╔════╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝██║  ██║██║   ██║██╔══██╗
███████╗██████╔╝██║   ██║██████╔╝   ██║   ███████╗███████║██║   ██║██████╔╝
╚════██║██╔═══╝ ██║   ██║██╔══██╗   ██║   ╚════██║██╔══██║██║   ██║██╔══██╗
███████║██║     ╚██████╔╝██║  ██║   ██║   ███████║██║  ██║╚██████╔╝██████╔╝
╚══════╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝
```

### 🏆 Sports Club Management Platform

*A full-stack web application for managing athletes, competitions, payments & certificates — built for state and national level sports associations.*

<br/>

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![AWS S3](https://img.shields.io/badge/AWS-S3-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com/s3)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payments-02042B?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com)

[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)
[![Maintained](https://img.shields.io/badge/Maintained-Yes-blue?style=flat-square)](https://github.com/Coderamrish/sports_club)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=flat-square)]()

<br/>

[🚀 Live Demo](#) &nbsp;·&nbsp; [📖 Docs](#api-endpoints) &nbsp;·&nbsp; [🐛 Report Bug](https://github.com/Coderamrish/sports_club/issues) &nbsp;·&nbsp; [💡 Request Feature](https://github.com/Coderamrish/sports_club/issues)

<br/>

---

</div>

## 📸 Screenshots

<div align="center">

| Admin Dashboard | Athlete Registration | Certificate |
|:-:|:-:|:-:|
| ![Dashboard](https://via.placeholder.com/380x220/0f172a/22d3ee?text=Admin+Dashboard) | ![Registration](https://via.placeholder.com/380x220/0f172a/a78bfa?text=Registration+Form) | ![Certificate](https://via.placeholder.com/380x220/0f172a/34d399?text=Certificate+PDF) |
| Real-time metrics & analytics | 8-step onboarding with validation | Auto-generated PDF with QR |

| Competition Management | Payment Gateway | Athlete Profile |
|:-:|:-:|:-:|
| ![Competition](https://via.placeholder.com/380x220/0f172a/fb923c?text=Competition+Manager) | ![Payment](https://via.placeholder.com/380x220/0f172a/f472b6?text=Razorpay+Integration) | ![Profile](https://via.placeholder.com/380x220/0f172a/60a5fa?text=Athlete+Profile) |
| Age/skill auto-filter & enrollment | UPI · Cards · Net Banking | Full history & achievements |

</div>

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🧑‍💼 For Athletes
- ✅ 8-step guided registration form
- ✅ Auto DOB → age calculation
- ✅ PIN code → state auto-detect
- ✅ Drag & drop document uploads
- ✅ Smart file compression (< 1MB)
- ✅ Age/skill auto-filtered competitions
- ✅ UPI, Cards & Net Banking payments
- ✅ PDF certificate download
- ✅ Achievement history & medals

</td>
<td width="50%">

### 🛡️ For Administrators
- ✅ Real-time analytics dashboard
- ✅ Document verification (Approve / Reject)
- ✅ Insurance expiry tracking (🔴 alerts)
- ✅ Duplicate prevention (mobile + email)
- ✅ Competition & result publishing
- ✅ Bulk certificate generation
- ✅ Data export (Excel / PDF)
- ✅ Automated email/SMS notification flows
- ✅ Full audit log of communications

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENT (React + Vite)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Auth    │  │ Athlete  │  │  Admin   │  │  Comp.   │  │  Certs   │ │
│  │  Pages   │  │ Profile  │  │Dashboard │  │  Mgmt    │  │  & PDF   │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│                         Redux Toolkit / Axios                           │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ REST API
┌────────────────────────────────▼────────────────────────────────────────┐
│                         SERVER (Express.js)                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │   Auth   │  │ Athletes │  │  Admin   │  │Payments  │  │  Certs   │ │
│  │  Routes  │  │  Routes  │  │  Routes  │  │ Razorpay │  │Puppeteer │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│            JWT Middleware · Role Guard · Multer + S3                    │
└───────┬──────────────────────────────┬──────────────────────────────────┘
        │                              │
┌───────▼──────┐              ┌────────▼────────┐
│   MongoDB    │              │    AWS S3       │
│   Atlas      │              │  (Documents,    │
│  (All data)  │              │  Certificates)  │
└──────────────┘              └─────────────────┘
        │
┌───────▼──────────────────────────────────────────┐
│         Notification Services                    │
│   Klaviyo Flows · Twilio SMS · AWS SES           │
└──────────────────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```
sports_club/
│
├── 📁 frontend/
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── 📁 common/           # Button, Input, Modal, ProgressBar
│   │   │   ├── 📁 auth/             # Login, Register, OTP verification
│   │   │   ├── 📁 athlete/          # Profile, 8-step registration form
│   │   │   ├── 📁 coach/            # Coach profile & management
│   │   │   ├── 📁 competition/      # List, filter, enroll
│   │   │   ├── 📁 admin/            # Dashboard, verification, reports
│   │   │   ├── 📁 payment/          # Razorpay integration UI
│   │   │   └── 📁 certificate/      # Download & share certificates
│   │   ├── 📁 pages/
│   │   ├── 📁 store/                # Redux slices
│   │   ├── 📁 hooks/                # Custom React hooks
│   │   ├── 📁 services/             # Axios API service layer
│   │   └── 📁 utils/                # Helpers & validators
│   ├── .env.example
│   └── package.json
│
├── 📁 backend/
│   ├── 📁 src/
│   │   ├── 📁 config/
│   │   │   ├── db.js                # MongoDB connection
│   │   │   ├── s3.js                # AWS S3 config
│   │   │   └── razorpay.js
│   │   ├── 📁 controllers/
│   │   │   ├── authController.js
│   │   │   ├── athleteController.js
│   │   │   ├── coachController.js
│   │   │   ├── competitionController.js
│   │   │   ├── paymentController.js
│   │   │   ├── adminController.js
│   │   │   ├── certificateController.js
│   │   │   └── notificationController.js
│   │   ├── 📁 models/
│   │   │   ├── User.js
│   │   │   ├── Athlete.js
│   │   │   ├── Coach.js
│   │   │   ├── Competition.js
│   │   │   ├── Registration.js
│   │   │   ├── Payment.js
│   │   │   ├── CompetitionResult.js
│   │   │   └── NotificationLog.js
│   │   ├── 📁 routes/
│   │   ├── 📁 middleware/
│   │   │   ├── authMiddleware.js    # JWT verification
│   │   │   ├── roleMiddleware.js    # Admin / Athlete / Coach guard
│   │   │   └── uploadMiddleware.js  # Multer + S3
│   │   └── 📁 services/
│   │       ├── emailService.js      # Klaviyo / SendGrid
│   │       ├── pdfService.js        # Puppeteer certificate generation
│   │       ├── s3Service.js
│   │       └── schedulerService.js  # Cron: reminders & alerts
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | >= 18.x |
| MongoDB | Atlas or Local |
| AWS Account | S3 bucket ready |
| Razorpay | Test/Live keys |

### 1️⃣ Clone

```bash
git clone https://github.com/Coderamrish/sports_club.git
cd sports_club
```

### 2️⃣ Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in your keys
npm run dev            # starts on http://localhost:5000
```

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env   # fill in your keys
npm run dev            # starts on http://localhost:5173
```

> 💡 Both servers must run simultaneously. The frontend proxies API calls to the backend.

---

## 🔐 Environment Variables

### Backend — `backend/.env`

```env
# ── Server ───────────────────────────────────────
PORT=5000
NODE_ENV=production

# ── Database ─────────────────────────────────────
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/sports_club

# ── Authentication ───────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
OTP_EXPIRY_MINUTES=10

# ── AWS S3 ───────────────────────────────────────
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=sports-club-documents

# ── Razorpay ─────────────────────────────────────
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# ── Email (Klaviyo recommended) ──────────────────
KLAVIYO_API_KEY=pk_xxxxxxxxxxxxxxxxxxxx
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxx   # alternative

# ── SMS (Twilio) ─────────────────────────────────
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE=+91XXXXXXXXXX

# ── App URL ──────────────────────────────────────
CLIENT_URL=https://yourapp.com
```

### Frontend — `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
```

---

## 📡 API Reference

<details>
<summary><b>🔐 Auth</b></summary>

```http
POST   /api/auth/register          Register new user (athlete/coach)
POST   /api/auth/login             Login and receive JWT
POST   /api/auth/verify-otp        Verify OTP for account activation
POST   /api/auth/resend-otp        Resend OTP to email
POST   /api/auth/forgot-password   Send password reset link
POST   /api/auth/reset-password    Reset password with token
```
</details>

<details>
<summary><b>🧑‍🤸 Athletes</b></summary>

```http
GET    /api/athletes/me                      Get own profile
PUT    /api/athletes/me                      Update profile
POST   /api/athletes/register                Submit full 8-step registration
GET    /api/athletes/competitions            Get enrolled competitions
GET    /api/athletes/achievements            Get medals & certificates
POST   /api/athletes/documents/upload        Upload document to S3
```
</details>

<details>
<summary><b>🏅 Competitions</b></summary>

```http
GET    /api/competitions                     List all (filtered by age/skill)
GET    /api/competitions/:id                 Competition details
POST   /api/competitions                     Create [Admin]
PUT    /api/competitions/:id                 Update [Admin]
DELETE /api/competitions/:id                 Delete [Admin]
POST   /api/competitions/:id/enroll          Athlete enroll
GET    /api/competitions/:id/participants    List enrolled athletes [Admin]
```
</details>

<details>
<summary><b>💳 Payments</b></summary>

```http
POST   /api/payments/create-order           Create Razorpay order
POST   /api/payments/verify                 Verify payment signature
GET    /api/payments/receipt/:id            Download receipt PDF
GET    /api/payments/status/:registrationId Check payment status
```
</details>

<details>
<summary><b>🛡️ Admin</b></summary>

```http
GET    /api/admin/dashboard                 Metrics & activity feed
GET    /api/admin/athletes                  All athletes (search/filter/export)
PUT    /api/admin/athletes/:id/verify       Approve / Reject documents
GET    /api/admin/athletes/insurance        Filter by insurance status
GET    /api/admin/payments                  Payment tracking (Paid/Pending/Failed)
GET    /api/admin/export/athletes           Download Excel / PDF report
```
</details>

<details>
<summary><b>🏆 Certificates</b></summary>

```http
POST   /api/certificates/results/:id        Publish results & assign medals [Admin]
GET    /api/certificates/download/:id       Download certificate PDF
POST   /api/certificates/bulk/:id           Bulk generate for all participants [Admin]
```
</details>

---

## 🗄️ Database Schema

```js
// 🧑 athletes
{
  userId, fullName, dob, age, gender, bloodGroup,
  mobile, email, address, city, state, pincode,
  clubName, stateRepresentation, district,
  documents: { photo, aadhaar, birthCertificate, noc, insurance },
  insuranceDetails: { provider, policyNumber, validTill },
  category, ageGroup, createdAt
}

// 🏅 competitions
{
  name, date, venue, ageGroup, skillLevel,
  registrationFee, deadline, insuranceRequired,
  createdBy, createdAt
}

// 📋 registrations
{
  athleteId, competitionId,
  paymentStatus: "Paid | Pending | Failed",
  documentStatus: "Approved | Rejected | Pending",
  registeredAt
}

// 🏆 competition_results
{
  registrationId, attendanceStatus: "Present | Absent",
  medal: "Gold | Silver | Bronze | None",
  certificateUrl,   // AWS S3 link
  publishedAt
}

// 📬 notification_logs
{
  userId, type, channel: "Email | SMS",
  subject, sentAt, status: "Delivered | Failed"
}
```

---

## 📩 Notification Flows

| Trigger | When | Channel |
|---------|------|---------|
| 🎉 Welcome Email | On account creation | Email |
| 🔢 OTP Verification | On signup | Email + SMS |
| 📄 Document Status | Admin approves/rejects | Email |
| ✅ Registration Confirmed | After competition enroll | Email |
| 💰 Payment Receipt | After successful payment | Email (PDF) |
| ❌ Payment Failed | On failed transaction | Email |
| ⏰ Event Reminder | 48h & 24h before event | Email + SMS |
| 💸 Fee Due Reminder | 3d & 1d before deadline | Email |
| 📎 Missing Document | Before cutoff | Email |
| 🏆 Results Published | When admin publishes | Email + SMS |
| 🎓 Certificate Ready | After cert generation | Email |

> Powered by **Klaviyo Flows** with event-based triggers and dynamic templates. All notifications are logged in `notification_logs` for admin audit.

---

## 🧩 8-Step Athlete Registration

```
┌──────────────────────────────────────────────────────────────┐
│  ●────●────●────●────●────●────●────●                        │
│  1    2    3    4    5    6    7    8                         │
│                                                              │
│  Step 1: Personal Details    (Name, DOB, Gender, Blood)      │
│  Step 2: Parent / Guardian   (Father, Mother, Guardian)      │
│  Step 3: Address             (PIN → State auto-detect 🔍)    │
│  Step 4: Club Details        (Club, NOC upload)              │
│  Step 5: Competition         (Age/skill auto-filtered)       │
│  Step 6: Documents           (Photo, Aadhaar, Insurance)     │
│  Step 7: Declaration         (Consent, T&C, Parent sign)     │
│  Step 8: Payment             (UPI / Cards / Net Banking)     │
└──────────────────────────────────────────────────────────────┘
```

**File Upload Features:**
- 📦 Auto-compression: images reduced to 70–80% quality, max 1024px
- 🖼️ Thumbnail preview + remove button per document
- 📁 Drag & drop zones for all uploads
- ☁️ Secure storage on AWS S3
- ✅ Supported: JPG, PNG (max 1MB) · PDF (max 2MB)

---

## 🎓 Certificate System

```
Admin publishes results
        │
        ▼
Puppeteer renders HTML template
   ┌────────────────────┐
   │  🏆 CERTIFICATE    │
   │  Athlete Name      │
   │  Competition Name  │
   │  Date  •  Medal    │
   │  [QR Code] ──────► athlete profile URL
   └────────────────────┘
        │
        ▼
PDF saved to AWS S3  →  URL stored in DB
        │
        ▼
Email sent to athlete: "Your certificate is ready!"
        │
        ▼
Athlete downloads from dashboard
```

---

## 🛠️ Tech Stack — Full Detail

| Category | Technology | Purpose |
|---|---|---|
| Frontend Framework | React 18 + Vite | UI rendering |
| Styling | Tailwind CSS | Utility-first CSS |
| State | Redux Toolkit | Global state |
| Forms | React Hook Form + Zod | Validation |
| HTTP | Axios | API calls |
| Compression | browser-image-compression | Frontend file optimization |
| Backend | Node.js + Express | REST API |
| Database | MongoDB + Mongoose | Data persistence |
| Auth | JWT + bcrypt | Secure authentication |
| File Storage | AWS S3 | Documents & certificates |
| Payments | Razorpay | UPI / Cards / Net Banking |
| Email | Klaviyo / SendGrid | Transactional + automation |
| SMS | Twilio | Event reminders |
| PDF | Puppeteer (Node.js) | Certificate generation |
| OTP | Nodemailer + crypto | Email verification |
| Scheduler | node-cron | Reminder jobs |
| Upload | Multer | File handling middleware |

---

## 🤝 Contributing

```bash
# 1. Fork the repo
# 2. Create your branch
git checkout -b feature/your-feature-name

# 3. Commit with conventional commits
git commit -m "feat: add bulk certificate generation"
git commit -m "fix: insurance expiry date validation"
git commit -m "docs: update API reference"

# 4. Push and open a PR
git push origin feature/your-feature-name
```

**Commit types:** `feat` · `fix` · `docs` · `refactor` · `chore` · `test`

---

## 📊 Project Stats

![GitHub commit activity](https://img.shields.io/github/commit-activity/m/Coderamrish/sports_club?style=flat-square&color=green)
![GitHub last commit](https://img.shields.io/github/last-commit/Coderamrish/sports_club?style=flat-square&color=blue)
![GitHub repo size](https://img.shields.io/github/repo-size/Coderamrish/sports_club?style=flat-square&color=orange)
![GitHub issues](https://img.shields.io/github/issues/Coderamrish/sports_club?style=flat-square&color=red)

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

<br/>

**Built with 🔥 by [@Coderamrish](https://github.com/Coderamrish)**

*If this project helped you, consider giving it a ⭐ on GitHub!*

[![GitHub stars](https://img.shields.io/github/stars/Coderamrish/sports_club?style=social)](https://github.com/Coderamrish/sports_club/stargazers)

</div>
