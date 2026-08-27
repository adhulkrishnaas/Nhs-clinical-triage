# CareFlow Triage

> A clinical triage and prioritisation prototype designed around NHS-style digital service principles, combining structured patient symptom intake, emergency red-flag detection, AI-assisted clinical assessment, and a real-time clinician triage dashboard.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-AI_Assistance-412991?logo=openai&logoColor=white)

---

## Overview

**CareFlow Triage** is a full-stack clinical triage prototype built to explore how a modern digital healthcare workflow could support the prioritisation of patient cases and assist clinical staff.

The application provides two primary workflows:

### Patient / Service User Workflow

Patients complete a structured three-step symptom assessment:

1. **Patient details**
2. **Symptom description**
3. **Review and consent**

The application performs emergency red-flag detection during the assessment and provides an immediate safety-netting response when potentially serious symptoms are identified.

### Clinician Workflow

Clinical staff can access a real-time triage queue where cases are prioritised according to urgency.

Clinicians can:

- View incoming cases
- See urgency classifications
- Identify emergency cases
- Review patient-submitted information
- Add clinical notes
- Update case status
- Record who reviewed the case
- Record the review timestamp
- Use AI-generated assessment information as **clinical assistance rather than autonomous diagnosis**

---

## Key Features

### 🏥 NHS-style User Interface

The interface was designed using NHS-inspired visual and accessibility principles, including:

- High-contrast interface
- NHS-style colour tokens
- Clear typography and hierarchy
- Prominent safety messaging
- Responsive layouts
- Accessible form controls
- ARIA-compliant alert components
- Clear error states
- Keyboard-friendly interactions

The interface intentionally prioritises **clarity, accessibility and safety over visual complexity**.

---

### 🚨 Emergency Red-Flag Safety Net

The symptom wizard contains an emergency detection layer designed to identify potentially concerning symptoms before submission.

Examples include:

- Chest pain
- Difficulty breathing
- Slurred speech
- Other configured red-flag symptom patterns

When a potential emergency is identified, the application presents a prominent safety overlay directing the user towards immediate emergency support.

The application explicitly states that it is a **triage prioritisation tool and not a diagnostic system**.

> **Important:** Emergency detection in this prototype must not be considered a clinically validated diagnostic or triage algorithm.

---

### 🤖 AI-Assisted Clinical Assessment

CareFlow Triage integrates OpenAI to provide structured symptom assessment assistance.

The AI service was designed to return structured information including:

- Urgency classification
  - `EMERGENCY`
  - `URGENT`
  - `ROUTINE`

- Clinical reasoning summary
- Structured assessment information

The AI output is then associated with the triage case and made available to the clinical workflow.

The system is intentionally designed around the principle that:

> **AI assists the clinician; it does not replace clinical judgement.**

AI-generated information should therefore be treated as decision support and independently reviewed by an appropriately qualified clinician.

---

### 📋 Real-Time Clinical Triage Queue

The clinician dashboard uses Firebase Firestore's real-time subscription functionality to provide an actively updating triage queue.

Cases are:

- Retrieved in real time
- Sorted according to urgency
- Separated into reviewed and pending cases
- Counted by overall pending status
- Counted specifically for emergency cases

Urgency ranking:

```text
EMERGENCY
    ↓
URGENT
    ↓
ROUTINE
    ↓
PENDING
```

Older cases are prioritised when cases have the same urgency level.

---

### 👩‍⚕️ Case Review

Clinicians can open an individual case and record:

- Review status
- Clinician notes
- Reviewing clinician
- Review timestamp

This provides a basic audit-oriented workflow around clinical case handling.

---

### 🔐 Authentication & Role-Based Access

Firebase Authentication is used for user authentication.

The application includes:

- Registration
- Login
- Protected routes
- Role-based navigation
- Patient/clinician workflow separation
- Authentication-aware redirects

The triage workflow is protected behind authentication rather than being publicly accessible.

---

### 🛡️ Consent & Safety Messaging

Before submitting an assessment, the user must acknowledge that:

> This is a triage prioritisation tool, not a diagnosis.

The application also provides safety messaging throughout the assessment workflow and explicitly directs users towards emergency services when appropriate.

---

### 📱 Responsive Design

The clinician dashboard and patient workflow have been designed to work across:

- Desktop
- Tablet
- Mobile

The dashboard was specifically refactored to improve mobile responsiveness.

---

# Technical Architecture

## Frontend

- React 19
- Vite
- React Router
- Tailwind CSS
- Lucide React

## Backend / Infrastructure

- Firebase Authentication
- Cloud Firestore
- Firestore real-time listeners

## AI

- OpenAI API
- Structured AI triage assessment
- JSON-based assessment output
- AI failure handling

## Testing

- Vitest
- React Testing Library
- Component tests
- Custom hook tests
- Integration-style workflow tests

---

# Project Structure

The application separates UI components, business logic and services to keep the codebase maintainable.

```text
src/
├── components/
│   ├── EmergencyOverlay.jsx
│   ├── ErrorSummary.jsx
│   ├── PatientDetailsStep.jsx
│   ├── ReviewStep.jsx
│   ├── SubmissionSuccess.jsx
│   ├── SymptomsStep.jsx
│   ├── WizardProgress.jsx
│   └── ...
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
├── test/
│   ├── EmergencyOverlay.test.jsx
│   ├── PatientDetailsStep.test.jsx
│   ├── ReviewStep.test.jsx
│   ├── SubmissionSuccess.test.jsx
│   ├── SymptomWizard.test.jsx
│   ├── SymptomsStep.test.jsx
│   ├── WizardProgress.test.jsx
│   ├── useCaseReview.test.js
│   ├── useEmergencyDetection.test.js
│   ├── useSymptomForm.test.js
│   ├── useTriageQueue.test.js
│   └── useWizardNavigation.test.js
│
└── ...
```

---

# Custom Hook Architecture

The main `SymptomWizard` component was deliberately refactored to separate UI rendering from application logic.

Instead of keeping all state and business logic inside a single component, functionality is separated into focused hooks.

### `useSymptomForm`

Responsible for:

- Patient form state
- Symptom information
- Consent state
- Field updates
- Form reset

### `useWizardNavigation`

Responsible for:

- Current step
- Next/previous navigation
- Step boundaries
- Wizard reset

### `useEmergencyDetection`

Responsible for:

- Red-flag detection
- Emergency state
- Emergency dismissal
- Accessibility focus handling

### `useTriageQueue`

Responsible for:

- Firestore queue subscription
- Loading state
- Case filtering
- Urgency ranking
- Pending counts
- Emergency counts
- Queue sorting

### `useCaseReview`

Responsible for:

- Selecting a case
- Managing clinician notes
- Saving review information
- Updating Firestore
- Review submission state

This separation makes the application easier to test, maintain and extend.

---

# Testing Strategy

Testing was introduced across both individual components and application logic.

The project currently tests:

### Components

- `EmergencyOverlay`
- `PatientDetailsStep`
- `SymptomsStep`
- `ReviewStep`
- `SubmissionSuccess`
- `WizardProgress`
- `SymptomWizard`

### Custom Hooks

- `useEmergencyDetection`
- `useSymptomForm`
- `useWizardNavigation`
- `useTriageQueue`
- `useCaseReview`

### Important Behaviour Covered

Tests verify:

- Form state changes
- Wizard navigation
- Boundary conditions
- Emergency detection
- Emergency dismissal
- Consent handling
- Submission behaviour
- Loading states
- Firestore errors
- Firestore subscription cleanup
- Queue sorting
- Urgency classification
- Clinician review
- Review timestamps
- Component rendering
- Reset workflows

Run the test suite with:

```bash
npm test
```

Run tests once without watch mode:

```bash
npm test -- --run
```

---

# Clinical Safety Considerations

Clinical safety was considered throughout the development of the prototype.

The application includes:

- Emergency red-flag detection
- Emergency safety-net messaging
- Explicit non-diagnostic messaging
- Consent before submission
- Human clinician review
- AI positioned as assistance rather than autonomous decision-making
- Error handling around AI assessment
- Role-based access
- Review metadata
- Real-time case visibility
- Automated testing of safety-critical UI behaviour

However, **this project has not been clinically validated or formally assured for use in a live NHS environment**.

It should therefore be considered a **portfolio / educational prototype**.

---

# NHS & Healthcare Digital Considerations

The project has been developed with several areas relevant to NHS digital services in mind.

These include:

- Accessibility
- Clear safety-netting
- Human oversight
- Role-based access
- Data minimisation considerations
- Authentication
- Audit-oriented review metadata
- Error handling
- Testing
- Responsive design
- Clear separation between clinical assistance and clinical decision-making

For a real clinical deployment, significantly more assurance would be required.

Potential areas requiring formal assessment include:

- Clinical safety standards and clinical risk management
- Data Protection Impact Assessment (DPIA)
- UK GDPR compliance
- Data Security and Protection Toolkit (DSPT) requirements
- Appropriate information governance
- Threat modelling and penetration testing
- Security review
- Accessibility conformance testing
- Clinical validation
- AI assurance and governance
- Data retention and deletion policies
- Operational monitoring
- Disaster recovery and business continuity
- Appropriate NHS integration and interoperability requirements
- Formal clinical safety documentation
- Appropriate regulatory assessment where applicable

The application **does not claim to have completed these assurance processes**.

---

# AI Safety & Governance

Because CareFlow Triage uses generative AI in a healthcare context, AI governance is an important part of the architecture.

The intended workflow is:

```text
Patient symptoms
       ↓
Emergency safety-net detection
       ↓
AI-assisted assessment
       ↓
Structured urgency information
       ↓
Clinical review
       ↓
Clinician decision
```

The AI should not be treated as an autonomous clinical decision-maker.

Important production requirements would include:

- Clinical validation of AI outputs
- Defined intended use
- Defined limitations
- Human oversight
- Monitoring for unsafe outputs
- Bias and fairness evaluation
- Prompt and model version control
- Auditability
- Appropriate data handling
- Robust failure behaviour
- Model performance monitoring
- Clear escalation procedures

---

# Security Considerations

The project includes authentication and protected application routes, but security for a production healthcare system would require substantially more work.

Production hardening would include:

- Strict Firestore security rules
- Principle of least privilege
- Server-side API protection
- Secrets management
- No client-side exposure of sensitive API credentials
- Dependency vulnerability scanning
- Security headers
- Rate limiting
- Audit logging
- Penetration testing
- Threat modelling
- Secure data retention and deletion
- Monitoring and alerting

No real patient-identifiable information should be used with this portfolio application.

---

# Environment Variables

Sensitive configuration should be provided through environment variables rather than committed to source control.

Example:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

OPENAI_API_KEY=
```

> Never commit API keys, Firebase credentials containing secrets, service-account credentials or real patient data to Git.

For production, AI API calls should be routed through a secure backend rather than exposing privileged credentials in a client-side application.

---

# Running Locally

## 1. Clone the repository

```bash
git clone https://github.com/adhulkrishnaas/Nhs-clinical-triage.git
cd Nhs-clinical-triage
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Create a local environment file and provide the required Firebase and AI configuration.

## 4. Start the development server

```bash
npm run dev
```

## 5. Run tests

```bash
npm test
```

## 6. Run linting

```bash
npm run lint
```

## 7. Create a production build

```bash
npm run build
```

---

# Development Approach

The project was developed incrementally using small, focused commits.

The development process included:

1. Initial application architecture
2. NHS-inspired UI foundation
3. Authentication
4. Protected routing
5. Patient symptom wizard
6. AI-assisted assessment
7. Firestore triage queue
8. Clinical dashboard
9. Safety and consent improvements
10. Responsive design
11. Custom hook refactoring
12. Component separation
13. Unit/component testing
14. End-to-end wizard workflow testing

This approach allowed functionality to be implemented first and then progressively improved for maintainability, safety and testability.

---

# Testing Progress

The test suite currently covers the core triage workflow, including:

```text
Emergency Detection       ✓
Symptom Form              ✓
Wizard Navigation         ✓
Triage Queue              ✓
Case Review               ✓
Emergency Overlay         ✓
Patient Details           ✓
Symptoms Step             ✓
Review Step               ✓
Submission Success        ✓
Wizard Integration        ✓
```

The test suite is intended to protect important application behaviour as the project continues to evolve.

---

# Roadmap

Potential next improvements include:

### Clinical Safety

- Formal clinical risk assessment
- Hazard log
- Clinical safety case
- Defined escalation pathways
- More comprehensive red-flag coverage
- Clinical validation with appropriate subject-matter experts

### Security

- Backend API layer for OpenAI
- Strong Firestore security rules
- Security testing
- Threat modelling
- Dependency auditing
- Audit logging

### Accessibility

- Full keyboard-navigation audit
- Screen-reader testing
- Automated accessibility testing
- WCAG 2.2 AA review
- Focus-management improvements

### Testing

- Increase edge-case coverage
- AI service tests
- Firebase integration tests
- Accessibility tests
- Browser-level end-to-end tests
- CI test pipeline

### AI Governance

- Model/prompt versioning
- AI output monitoring
- Bias evaluation
- Structured safety evaluation
- Human-in-the-loop review
- Failure and fallback analysis

### NHS Integration

Future production-oriented work could explore appropriate interoperability standards and integration patterns, depending on the intended NHS use case.

---

# Disclaimer

**CareFlow Triage is a software engineering portfolio project and clinical triage prototype.**

It is **not an NHS service, medical device, diagnostic system or substitute for professional medical judgement**.

The AI-generated information is experimental clinical decision-support functionality and must not be relied upon for real-world diagnosis or treatment.

Do not enter real patient-identifiable or confidential health information into this demonstration application.

For emergencies, users should seek appropriate emergency medical assistance rather than relying on this application.

---

# Why I Built This

CareFlow Triage was built as a practical demonstration of how software engineering principles can be applied to a healthcare environment where **safety, accessibility, security, testing and human oversight are as important as functionality**.

The project explores the intersection of:

- React application development
- Healthcare UX
- Clinical workflow design
- Firebase
- AI-assisted decision support
- Accessibility
- Authentication and authorisation
- Automated testing
- Software architecture
- Clinical safety considerations

Rather than treating AI as a replacement for clinicians, the project explores how AI could potentially be incorporated into a workflow where **the clinician remains responsible for the final decision**.

---

## Author

**Adhul Krishna**

Built as a healthcare-focused software engineering portfolio project.

[GitHub Repository](https://github.com/adhulkrishnaas/Nhs-clinical-triage)
