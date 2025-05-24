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

## Tech Stack

- [Next.js](https://nextjs.org) – React framework for server-side rendering and static site generation
- [TypeScript](https://www.typescriptlang.org/) – Strongly typed JavaScript
- [Prisma](https://prisma.io) – ORM for database access
- [Stripe](https://stripe.com) – Payment processing
- [AssemblyAI](https://www.assemblyai.com/) – Audio transcription and summarization
- [tRPC](https://trpc.io) – End-to-end typesafe APIs
- [Tailwind CSS](https://tailwindcss.com) – Utility-first CSS framework
- [NextAuth.js](https://next-auth.js.org) – Authentication for Next.js
- [Drizzle ORM](https://orm.drizzle.team) – TypeScript ORM (if used in your project)
- [Supabase](https://supabase.com) – (if used for storage or authentication)
- [Appwrite](https://appwrite.io) – (if used for storage)
- [GitHub API](https://docs.github.com/en/rest) – Repository data and analysis

---

## Getting Started

1. **Clone the repository**
   ```sh
   git clone [https://github.com/Meghashree-V/RepoBrief.git](https://github.com/Meghashree-V/RepoBrief.git)
   cd RepoBrief

2. **Install dependencies**
   ```sh
   npm install
   # or
   yarn install

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
   npx prisma migrate deploy

5. **Start the development server**
   ```sh
   npm run dev
   # or
   yarn dev

6. **Usage**
   Billing/Credits: Purchase credits on the billing page using Stripe. 50 credits = $1.
   Project Analysis: Create a new project, and RepoBrief will analyze your repository using AI.
   Meeting Upload: Upload audio files for meetings and get transcriptions and summaries.
   Q&A: Use the AI Q&A to ask about code, UI elements, or repository structure. The system highlights exact lines and references in the codebase.
   Team Management: Invite team members and manage access.

7. **Contributing**
   Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

8. **License**
   MIT
