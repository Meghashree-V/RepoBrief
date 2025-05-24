# RepoBrief

RepoBrief is an AI-powered platform designed to help teams understand and navigate their codebases and meetings with ease. It provides instant answers to questions about your repository, summarizes meetings, and supports seamless onboarding and collaboration.

---

## Features

- **AI-Powered Q&A**: Ask questions about your codebase in plain English and get precise answers, including highlighted code references.
- **Meeting Analysis**: Upload meeting audio files and receive transcriptions and AI-generated summaries (powered by AssemblyAI).
- **Stripe Integration**: Purchase and manage credits for project analysis using Stripe payments.
- **Team Collaboration**: Manage team members, assign roles, and work together on repository analysis.
- **Modern UI**: Built with Next.js, Tailwind CSS, and a suite of reusable components for a beautiful and responsive experience.
- **Authentication**: Secure sign-in and sign-up using NextAuth.js.
- **Project Management**: Create, archive, and manage multiple repositories and projects.
- **Credit System**: Check and purchase credits, with usage tracked for analysis features.

---
---

## 🚀 How It Works

RepoBrief’s workflow is simple and visual. Follow these steps to get started:

---

### 1. Sign Up with Clerk  
Sign up or log in securely using Clerk authentication.

![Sign Up]([https://your-image-link.com/signup.png](https://github.com/user-attachments/assets/82536c02-4326-45fc-99a3-e811e31dc424))

---

### 2. Create a Project  
Connect your GitHub repository and create a new project. All metadata is stored in Neon (Postgres).

![Create Project]([https://your-image-link.com/create-project.png](https://github.com/user-attachments/assets/17357bfa-51bc-43c7-922e-4aabb6bd2eb8))

---

### 3. Purchase Credits via Stripe  
Go to the billing page and purchase credits using Stripe. Your credit balance is tracked in prisma database.

![Purchase Credits](https://github.com/user-attachments/assets/ad566ac2-ee6a-4250-88d9-8ff53ad0ac7a)
![After Purchasing Credits](https://github.com/user-attachments/assets/8b72550e-0886-48d8-80c8-79e4e707e192)


---

### 4. Ask Questions about Your Codebase  
Use the AI-powered Q&A feature to ask questions about your codebase. RepoBrief highlights relevant code and answers in context.

![AI Q&A](![image](https://github.com/user-attachments/assets/f08efa4e-9425-4034-b463-06c0c8816aef))
![Q&A Page saved answers](![image](https://github.com/user-attachments/assets/47f1aa5c-c295-4aa8-a9ae-d85c1476c6ed))

---

### 5. Upload Meeting Audio  
Upload meeting audio files through the dashboard. Files are securely stored in Supabase.

![Upload Meeting](https://your-image-link.com/upload-meeting.png)

---

### 6. Get Meeting Transcription & Summary  
RepoBrief uses AssemblyAI to transcribe and summarize your meeting audio. Transcriptions and summaries are saved in Supabase.

![Meeting Summary](https://your-image-link.com/meeting-summary.png)

---

### 7. Collaborate with Your Team  
Invite team members, assign roles, and collaborate on code and meeting analysis.

![Team Collaboration](https://your-image-link.com/team-collaboration.png)

---

### 8. Manage Your Profile  
Edit your name, avatar, and view your joined projects and available credits — all from the Profile page.

![Profile Page](https://your-image-link.com/profile.png)

---

### 9. Archive Completed Projects  
Finished a project? Archive it to keep your workspace clean while preserving data for future reference.

![Archive Project](https://your-image-link.com/archive-project.png)



## Tech Stack

- [Next.js](https://nextjs.org) – React framework for server-side rendering and static site generation
- [TypeScript](https://www.typescriptlang.org/) – Strongly typed JavaScript
- [Prisma](https://prisma.io) – ORM for database access
- [Neon](https://neon.tech) – Serverless Postgres database
- [Clerk](https://clerk.com) – Authentication and user management
- [Stripe](https://stripe.com) – Payment processing
- [AssemblyAI](https://www.assemblyai.com/) – Audio transcription and summarization
- [tRPC](https://trpc.io) – End-to-end typesafe APIs
- [Tailwind CSS](https://tailwindcss.com) – Utility-first CSS framework
- [Clerk](https://clerk.dev) – Authentication and user management for Next.js  
- [Supabase](https://supabase.com) – Stores meeting files and transcription history
- [GitHub API](https://docs.github.com/en/rest) – Repository data and analysis
---

## Getting Started

1. **Clone the repository**
   ```sh
   git clone [https://github.com/Meghashree-V/RepoBrief.git](https://github.com/Meghashree-V/RepoBrief.git)
   cd RepoBrief

2. **Install dependencies**
   ```sh
   bun install

3. **Set up environment variables**
   Copy .env.example to .env
   Fill in the required values:
   STRIPE_SECRET_KEY
   STRIPE_PUBLISHABLE_KEY
   STRIPE_WEBHOOK_SECRET
   NEXT_PUBLIC_APP_URL
   ASSEMBLYAI_API_KEY
   Any other required keys for authentication or database

4. **Run database migrations**
   ```sh
   bun prisma migrate deploy

5. **Start the development server**
   ```sh
   bun dev

6. **To check prisma db***
   ```sh
   bun prisma studio

7. **Stripe CLI Webhook Forwarding- INSTALL STRIPE CLI***
   ```sh
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

8. **Usage**
   Billing/Credits: Purchase credits on the billing page using Stripe. 50 credits = $1.
   Project Analysis: Create a new project, and RepoBrief will analyze your repository using AI.
   Meeting Upload: Upload audio files for meetings and get transcriptions and summaries.
   Q&A: Use the AI Q&A to ask about code, UI elements, or repository structure. The system highlights exact lines and references in the codebase.
   Team Management: Invite team members and manage access.

9. **Contributing**
   Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

10. **License**
   MIT
