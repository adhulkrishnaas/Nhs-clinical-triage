# CareFlow Triage

> **AI-assisted clinical triage and clinician decision-support platform built with React, Firebase and OpenAI.**

CareFlow Triage is a healthcare-focused web application designed to demonstrate how modern web technologies and AI-assisted workflows can support the **clinical triage process**.

The application collects structured patient symptom information, performs emergency red-flag detection, uses OpenAI to generate a structured triage assessment, and places cases into a real-time clinician queue for human review.

The project has been developed as a **portfolio project for NHS Band 5 software/technology roles**, with particular focus on accessibility, safety-netting, authentication, role-based access, testing, maintainable architecture, and responsible use of AI.

> ⚠️ **Important:** CareFlow Triage is a portfolio/prototype application. It is not a medical device, does not provide a diagnosis, and must not be used as a substitute for professional clinical judgement.

---

## 🤖 AI-Powered Clinical Assistance

AI-assisted clinical support is a core part of CareFlow Triage.

The application integrates **OpenAI's GPT-4o-mini** to analyse the symptoms submitted by a patient and produce a structured triage assessment.

The AI is deliberately positioned as a **decision-support layer rather than an autonomous clinical decision-maker**.

### AI workflow

```text
Patient symptoms
       │
       ▼
Symptom Wizard
       │
       ▼
Emergency / Red-Flag Detection
       │
       ├── Emergency detected
       │        │
       │        ▼
       │   Emergency Safety Net
       │
       ▼
OpenAI Triage Service
       │
       ├── Urgency classification
       │
       └── Clinical reasoning summary
       │
       ▼
Structured Triage Result
       │
       ▼
Firestore
       │
       ▼
Real-Time Clinician Queue
       │
       ▼
Clinician Review
```

### Structured urgency classification

The AI assessment uses structured urgency categories:

| Classification | Purpose                                       |
| -------------- | --------------------------------------------- |
| `EMERGENCY`    | Cases requiring immediate emergency attention |
| `URGENT`       | Cases requiring prompt clinical review        |
| `ROUTINE`      | Cases appropriate for routine review          |

The application uses structured JSON responses rather than relying on unpredictable free-form model output.

This makes the AI integration easier to:

- Validate
- Test
- Process programmatically
- Store in Firestore
- Display consistently within the clinician dashboard

### Human clinical oversight

AI-generated triage information is surfaced to the **clinician dashboard** rather than being treated as a final clinical decision.

Clinicians can:

- Review submitted cases
- View urgency classification
- Review the AI-generated assessment
- Add clinician notes
- Update the case status
- Record who reviewed the case
- Record when the review occurred

This creates a workflow where AI assists with prioritisation while **clinical responsibility remains with the human reviewer**.

### AI safety considerations

The project intentionally separates emergency safety-netting from the AI assessment.

Recognised red-flag symptoms can trigger an emergency warning and provide immediate access to:

- **999**
- **NHS 111**

The application also includes fallback handling for AI/API failures so that an external service failure does not silently leave a submitted case without a triage state.

---

# 🏥 Core Features

## Patient Symptom Assessment

A structured three-step wizard collects:

1. Patient age category
2. Symptom duration
3. Primary symptoms
4. Patient consent

The wizard provides clear navigation, validation and progress indication.

---

## 🚨 Emergency Safety Net

CareFlow Triage includes an independent red-flag detection layer designed to identify potentially serious symptoms.

Examples include:

- Chest pain
- Difficulty breathing
- Slurred speech

When a recognised emergency symptom is detected, the application presents an accessible emergency overlay advising the user not to wait for an online response.

The emergency interface provides direct telephone links to:

```text
999 — Emergency services
111 — NHS 111
```

The system also allows the user to acknowledge the warning and continue with submission.

---

# 👨‍⚕️ Clinician Dashboard

Submitted cases are placed into a **real-time Firestore triage queue**.

The clinician dashboard provides:

- Live case updates
- Urgency prioritisation
- Pending case counts
- Emergency case counts
- Reviewed/unreviewed filtering
- Case review workflow
- Clinician notes
- Review status
- Reviewer identity
- Review timestamps

Cases are prioritised using an urgency ranking:

```text
EMERGENCY
    ↓
URGENT
    ↓
ROUTINE
    ↓
PENDING
```

---

# 🔥 Firebase Integration

Firebase provides the application's authentication and data infrastructure.

### Firebase Authentication

The application includes:

- User registration
- Login
- Authentication state
- Protected routes
- Role-based access control
- Post-login routing

### Cloud Firestore

Firestore is used for the triage queue.

The clinician dashboard uses Firestore's real-time `onSnapshot` listener so that new or updated cases can appear without requiring a page refresh.

Case review information includes:

- Status
- Clinician notes
- Reviewer
- Review timestamp

---

# 🔐 Security & Access Control

Security was treated as an important part of the application's architecture.

Implemented features include:

- Protected application routes
- Authentication requirements
- Role-based access control
- Restricted triage workflow access
- Firebase-backed identity
- Separation of patient-facing and clinician functionality

The project also includes work specifically focused on **hardening the triage workflow and addressing security exposure**.

---

# ♿ Accessibility & NHS-Style Design

The interface follows an NHS-inspired design approach with emphasis on clarity, accessibility and high-contrast presentation.

Implemented considerations include:

- High-contrast colour palette
- NHS-style design tokens
- Accessible form labels
- Semantic HTML
- ARIA attributes
- `role="alertdialog"` emergency messaging
- Keyboard-focusable emergency overlay
- Clear error messaging
- Disabled states
- Responsive layouts
- Mobile-friendly clinician dashboard

The project includes an ARIA-compliant safety banner and an accessible emergency alert workflow.

> The visual design is **NHS-inspired** and should not be interpreted as an official NHS product or NHS service.

---

# 🧪 Testing

Testing was added using **Vitest** and **React Testing Library**.

The project uses unit and component tests to verify both isolated logic and important user interactions.

Current test coverage includes:

### Custom hooks

- `useEmergencyDetection`
- `useSymptomForm`
- `useWizardNavigation`
- `useTriageQueue`
- `useCaseReview`

### Components

- `EmergencyOverlay`
- `WizardProgress`
- `PatientDetailsStep`
- `SymptomsStep`
- `ReviewStep`
- `SubmissionSuccess`
- `SymptomWizard`

Tests cover behaviours including:

- Initial state
- User interaction
- Form updates
- Wizard navigation
- Emergency detection
- Firestore subscriptions
- Queue sorting
- Pending/emergency counts
- Review submission
- Error handling
- Loading states
- Component rendering
- Accessibility-related behaviour
- Reset workflows

Example test result:

```text
Test Files  5 passed
Tests       52 passed
```

The test suite is designed to protect the application's critical triage and workflow logic as the project evolves.

---

# 🧩 Maintainable React Architecture

The application was deliberately refactored to separate UI components from application logic.

Instead of keeping the complete triage workflow inside a single large component, reusable custom hooks handle specific responsibilities.

### Example hook structure

```text
src/
├── components/
│   ├── EmergencyOverlay.jsx
│   ├── ErrorSummary.jsx
│   ├── PatientDetailsStep.jsx
│   ├── ReviewStep.jsx
│   ├── SubmissionSuccess.jsx
│   ├── SymptomsStep.jsx
│   └── WizardProgress.jsx
│
├── hooks/
│   ├── useCaseReview.js
│   ├── useEmergencyDetection.js
│   ├── useSymptomForm.js
│   ├── useTriageQueue.js
│   ├── useTriageSubmission.js
│   └── useWizardNavigation.js
│
├── services/
│   ├── firebase.js
│   └── openaiTriage.js
│
└── test/
    ├── EmergencyOverlay.test.jsx
    ├── PatientDetailsStep.test.jsx
    ├── ReviewStep.test.jsx
    ├── SubmissionSuccess.test.jsx
    ├── SymptomWizard.test.jsx
    ├── SymptomsStep.test.jsx
    ├── WizardProgress.test.jsx
    ├── useCaseReview.test.js
    ├── useEmergencyDetection.test.js
    ├── useSymptomForm.test.js
    ├── useTriageQueue.test.js
    └── useWizardNavigation.test.js
```

This separation makes the application easier to:

- Understand
- Test
- Maintain
- Extend
- Debug

---

# 🛠️ Technology Stack

| Technology                  | Purpose                        |
| --------------------------- | ------------------------------ |
| **React 19**                | Frontend application           |
| **Vite**                    | Development/build tooling      |
| **Tailwind CSS v4**         | UI styling                     |
| **React Router**            | Application routing            |
| **Firebase Authentication** | Authentication and identity    |
| **Cloud Firestore**         | Real-time triage queue         |
| **OpenAI GPT-4o-mini**      | AI-assisted symptom assessment |
| **Lucide React**            | Interface icons                |
| **Vitest**                  | Test runner                    |
| **React Testing Library**   | Component testing              |
| **ESLint**                  | Code quality                   |

---

# 🏗️ High-Level Architecture

```text
                    ┌─────────────────────┐
                    │       Patient       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Symptom Wizard    │
                    └──────────┬──────────┘
                               │
                     ┌─────────┴─────────┐
                     │                   │
                     ▼                   ▼
              Red-Flag Detection    Form Validation
                     │
                     ▼
              Emergency Safety Net
                     │
                     ▼
              OpenAI Triage Service
                     │
                     ▼
              Structured Assessment
                     │
                     ▼
              Cloud Firestore Queue
                     │
                     ▼
              Real-Time Dashboard
                     │
                     ▼
              Clinician Review
                     │
             ┌───────┴────────┐
             ▼                ▼
       Clinical Notes     Status Update
```

---

# 📁 Project Structure

```text
src/
├── components/
├── hooks/
├── services/
├── pages/
├── test/
├── App.jsx
└── main.jsx
```

The architecture follows a separation of concerns between:

- Presentation
- Application state
- Business logic
- External services
- Testing

---

# 🚀 Getting Started

## Prerequisites

You will need:

- Node.js
- npm
- A Firebase project
- An OpenAI API key

## Installation

Clone the repository:

```bash
git clone https://github.com/adhulkrishnaas/Nhs-clinical-triage.git
```

Navigate into the project:

```bash
cd Nhs-clinical-triage
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

---

# 🔑 Environment Variables

Create a `.env` file containing the required Firebase and OpenAI configuration.

Example:

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_OPENAI_API_KEY=your_key
```

**Never commit real API keys or secrets to Git.**

For a production healthcare application, the OpenAI integration should be placed behind a secure backend/service boundary rather than exposing sensitive credentials in a client-side application.

---

# 🧪 Running Tests

Run the test suite with:

```bash
npm test
```

Run tests once:

```bash
npm test -- --run
```

Run linting:

```bash
npm run lint
```

Build the application:

```bash
npm run build
```

---

# 📋 Development Approach

The project has been developed incrementally using small, focused commits.

Examples include:

```text
feat(ai): create openaiTriage service for structured symptom evaluation

feat(triage): integrate gpt-4o-mini for dynamic AI symptom assessment

feat(triage): add red-flag safety net, consent gate, NHS.uk styling to symptom wizard

feat(dashboard): integrate Firestore real-time queue stream with onSnapshot

feat(auth): implement ProtectedRoute component for role-based access control

refactor: extract SymptomWizard logic into custom hooks

refactor: split StaffDashboard into hooks and components

test: add emergency detection tests

test: add useSymptomForm tests

test: add useWizardNavigation tests

test: add useTriageQueue tests

test: add useCaseReview tests

test: add SymptomWizard tests
```

This reflects an iterative approach where functionality, safety, maintainability and testing were developed alongside one another.

---

# 🎯 Why I Built This

CareFlow Triage was built as a practical demonstration of how software engineering principles can be applied to a healthcare workflow.

The project focuses on areas particularly relevant to clinical technology environments:

- User-centred design
- Accessibility
- Safety-netting
- Secure authentication
- Role-based access
- Real-time data
- AI-assisted workflows
- Structured data
- Error handling
- Automated testing
- Maintainable React architecture
- Separation of concerns
- Human oversight of AI-generated information

Rather than treating AI as a replacement for clinicians, the project explores how AI can be integrated as an **assistive layer within a controlled workflow**.

---

# ⚠️ Clinical & Safety Disclaimer

CareFlow Triage is an educational and portfolio project.

It has **not** been clinically validated, commissioned, approved or deployed for use with real patients.

AI-generated information may be inaccurate and must not be relied upon for diagnosis, treatment or emergency decision-making.

Any real-world implementation would require appropriate clinical governance, validation, information governance, security assessment, regulatory assessment, monitoring, testing and professional clinical oversight.

---

# 🔮 Future Improvements

Potential next steps include:

- Backend proxy for OpenAI API calls
- Stronger server-side security controls
- Expanded automated test coverage
- End-to-end testing
- AI evaluation and monitoring
- Audit logging
- More comprehensive accessibility testing
- Clinical terminology integration
- More sophisticated triage rules
- Improved AI output validation
- Observability and error monitoring
- Production deployment architecture
- Formal clinical safety and governance assessment

---

# 👨‍💻 Author

**Adhul Krishna**

Built as a portfolio project demonstrating modern React development, Firebase architecture, AI integration, testing, accessibility and healthcare-focused software engineering.

---

## ⭐ Key Takeaway

CareFlow Triage demonstrates an approach to building healthcare software where:

**AI assists → rules provide safety-netting → data is structured → clinicians review → software supports rather than replaces clinical judgement.**
