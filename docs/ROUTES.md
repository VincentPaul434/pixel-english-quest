# Route Registry

Routes are organized by role under `src/routes/auth`, `src/routes/student`, and `src/routes/teacher`. The top-level `src/routes/index.tsx` owns browser history, role guards, legacy workspace redirects, and the combined route registry.

## Public

| Route ID | Path | Page |
| --- | --- | --- |
| `auth` | `/auth` | Sign in, registration, and account recovery |

## Student

| Route ID | Path | Page |
| --- | --- | --- |
| `student-dashboard` | `/student/dashboard` | Progress overview and announcements |
| `student-courses` | `/student/courses` | Courses and lessons |
| `student-assignments` | `/student/assignments` | Assigned work and due dates |
| `student-learning-hub` | `/student/learning-hub` | Classrooms, catalog, discussions, calendar, and submissions |
| `student-study` | `/student/study` | Vocabulary and flashcards |
| `student-achievements` | `/student/achievements` | Achievement collection |
| `student-activity` | `/student/activity` | Learning activity history |

## Teacher

| Route ID | Path | Page |
| --- | --- | --- |
| `teacher-dashboard` | `/teacher/dashboard` | Teaching overview |
| `teacher-courses` | `/teacher/courses` | Course and lesson management |
| `teacher-students` | `/teacher/students` | Learner progress |
| `teacher-assignments` | `/teacher/assignments` | Assignment tracking |
| `teacher-operations` | `/teacher/operations` | Classrooms, grading, invitations, calendar, and reports |

`/student` and `/teacher` remain supported as legacy entry points and redirect to the appropriate dashboard. Authenticated users cannot open routes belonging to the other role, and unknown routes redirect to the signed-in user's dashboard.
