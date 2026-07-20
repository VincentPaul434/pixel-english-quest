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

The Render Blueprint in the API repository deploys this project as a static site and supplies `VITE_API_HOST` automatically. Direct client-side routes are rewritten to `index.html`.

## Demo access

Use the Student demo and Teacher demo buttons on the sign-in page. The demo credentials are also documented in the API project.

## Learner workspace

- Account creation, sign-in, onboarding, proficiency, learning goal, and daily target
- Recommended/resumable lessons and automatically saved draft answers
- Courses, modules, assignments, announcements, and due dates
- Reading, grammar, listening, and speaking learning paths
- Multimedia/resource links, narration, and browser microphone practice
- Multiple question types, mastery scoring, explanations, and attempt review
- Per-skill mastery, actual focus time, streaks, XP, levels, and achievements
- Private lesson notes, bookmarks, vocabulary flashcards, and activity history

## Teacher workspace

- Course and module creation
- Full lesson editor with draft, preview, publish, and archive workflows
- Learning objectives, hosted audio/video/resources, and speaking/listening content
- Multiple-choice, true/false, and fill-in-the-blank question builder
- Adjustable duration, difficulty, mastery threshold, and XP reward
- Student assignment with due date and learner selection
- Announcements, student progress, assignment completion, and lesson analytics
- Question-level correct-rate and attempt-level performance reports

## Commands

```bash
npm run check
npm run build
```

The interface includes keyboard-visible focus styles, Escape-close dialogs, reduced-motion support, responsive layouts, and labeled interactive controls.
