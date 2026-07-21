# Pixel English Quest Frontend

The React and TypeScript interface for English Pixel Academy. It contains separate learner and teacher workspaces while preserving the responsive pixel-art experience.

## Development

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:5173` and proxies `/api` to `http://localhost:3001`.

To connect to a separately deployed API, create `.env`:

```env
VITE_API_URL=https://your-api.example.com
```

`vercel.json` provides the production Vite SPA fallback. Set `VITE_API_URL` in Vercel to the deployed API URL.

## Demo access

Use the Student demo and Teacher demo buttons on the sign-in page. The demo credentials are also documented in the API project.

## Learner workspace

- Account creation, sign-in, onboarding, proficiency, learning goal, and daily target
- Recommended/resumable lessons and automatically saved draft answers
- Courses, modules, assignments, announcements, and due dates
- Public catalog enrollment, classrooms, calendar, discussions, and notifications
- Written/file submissions, teacher feedback, verified completion certificates, email verification, and authenticator MFA
- Reading, grammar, listening, and speaking learning paths
- Multimedia/resource links, narration, and browser microphone practice
- Multiple question types, mastery scoring, explanations, and attempt review
- Per-skill mastery, actual focus time, streaks, XP, levels, and achievements
- Private lesson notes, bookmarks, vocabulary flashcards, and activity history

## Teacher workspace

- Course and module creation
- Full lesson editor with draft, preview, publish, and archive workflows
- Learning objectives, hosted audio/video/resources, and speaking/listening content
- Multiple-choice, true/false, fill-in, essay, matching, and ordering question builder with weighted points
- Adjustable duration, difficulty, mastery threshold, XP, attempts, and availability windows
- Public/private catalog settings, enrollment mode, and completion certificates
- Student assignments with due dates, instructions, submission types, and resubmission rules
- Announcements, student progress, assignment completion, and lesson analytics
- Question-level correct-rate and attempt-level performance reports
- Classrooms, rosters, calendar events, grading, question bank, CSV exports, and lesson duplication/reordering/version history
- Admin user controls, system summary, and audit trail

## Commands

```bash
npm run check
npm run build
```

The interface includes keyboard-visible focus styles, Escape-close dialogs, reduced-motion support, responsive layouts, and labeled interactive controls.
