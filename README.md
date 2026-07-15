# God Generals Standard Academy — Result Portal

A web-based result management system for **God Generals Standard Academy, Ikare-Akoko, Ondo State**, Nigeria.

Teachers can input student exam scores from any device (phone or desktop), the system auto-calculates grades, positions, and class averages, and students can check their finalized results online using a PIN.

## ✨ Features

### For Teachers
- 🔒 **Hidden login**: Tap the school logo 3 times on the homepage to reveal the teacher login.
- 📚 **Class-based navigation**: Pick a class → pick a student → enter scores.
- ⚡ **Auto-calculations**: Total, Grade (A–F), and Remark are computed live as you type.
  - Position and Class Average are computed across all students in the class on **Finalize**.
- ✏️ **Editable fields**: Test 1, Test 2, Exam, 1st/2nd/3rd term scores, character/behaviour traits, teacher's report, principal's report, teacher's signature, and "next term begins".
- 📋 **Default subjects**: 16 default subjects (English, Maths, Yoruba, Basic Science, etc.) pre-loaded for each class.
- 💾 **Save Draft / Finalize**: Save work-in-progress, finalize when ready (student can then view it).
- 🔢 **Auto-generated PIN**: When you click Finalize, the system generates a unique 6-digit PIN for that student's result. The PIN is displayed prominently in a green banner so you can copy it and give it to the student.
- 📄 **Printable result**: Click "View Result" to see a printable sheet — use your browser's Print to save as PDF.

### For Students
- 🔢 **PIN-only access**: Enter the 6-digit PIN your teacher gave you — that's it. No name, admission number, term, or session needed.
- 🎯 **One PIN per result**: Each term/year has its own unique PIN. The PIN alone identifies the student, term, and session.
- 📊 **Full result sheet**: Identical layout to the paper report card.
- 🖨️ **Download/Print**: One click to print or save as PDF.

### For Admins
- Manage students, teachers, classes, and subjects (full CRUD).
- Assign teachers to classes.
- Reset student PINs.

## 🎨 Result Template

Matches the paper report card, with these adjustments per school request:
- ✅ "DUPLICATE" word **removed**
- ✅ "Sign" column **removed** (principal signature is auto-shown, teacher signature is text)
- ✅ All `____________` placeholders **replaced with real input data**
- ✅ School logo + name + address + contact in the header
- ✅ Subject table with columns: SUBJECT, Test 1, Test 2, Exam, Total, 1st/2nd/3rd Term, Total Score, Graded, Class Avg, Position, Grade, Remark
- ✅ Development (Skills) + Behaviour ratings (A–E)
- ✅ Class Teacher's Report + Principal's Report
- ✅ Auto-shown Principal's signature + stamp
- ✅ Teacher's signature (entered by teacher)
- ✅ Keys to Rating + Score Rating
- ✅ Next Term Begins

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Prisma ORM + SQLite
- **Auth**: Custom signed-cookie session (lightweight, no external auth service)

## 🚀 Getting Started

```bash
# 1. Install deps
bun install   # or npm install / pnpm install

# 2. Set up the database
cp .env.example .env   # then edit DATABASE_URL if needed
bun run db:push

# 3. Seed default data (subjects, classes, admin, sample students)
bunx tsx scripts/seed.ts

# 4. Run the dev server
bun run dev
```

Open http://localhost:3000 in your browser.

## 🔑 Demo Accounts

After seeding:

| Role     | Username   | Password     |
|----------|------------|--------------|
| Admin    | `admin`    | `admin123`   |
| Teacher  | `teacher1` | `teacher123` |

Sample students (class JSS 1):
- `JSS1/001` — Adeyemi Johnson
- `JSS1/002` — Bola Adekunle
- `JSS1/003` — Chinedu Okafor
- `JSS1/004` — Fatima Bello
- `JSS1/005` — Samuel Ojo

Demo result PIN: `1234` (finalized 1st Term 2025/2026 result for Adeyemi Johnson)

## 📁 Project Structure

```
prisma/
  schema.prisma           # Database models
scripts/
  seed.ts                 # Initial data (subjects, classes, admin, sample students)
  gen_principal_sig.py    # Generates the principal signature image
src/
  app/
    api/                  # Backend API routes (auth, teacher, student, admin, finalize)
    page.tsx              # Main SPA page (state-based routing)
    layout.tsx            # Root layout
    globals.css           # Tailwind + custom GGSA styles + print styles
  components/
    result-sheet.tsx      # Printable result template
    teacher-edit-form.tsx # Score input form with auto-calc
    admin-panel.tsx       # Admin CRUD UI
    ui/                   # shadcn/ui components
  lib/
    auth.ts               # Password + PIN hashing
    session.ts            # Cookie-based session
    constants.ts          # Default subjects, grading scale, school info
    calc.ts               # Position/average/grade calculation helpers
    db.ts                 # Prisma client
public/
  logo.jpeg               # School logo (extracted from screenshot)
  principal-signature.png # Auto-shown principal signature
  principal-stamp.png     # Principal stamp/seal
```

## 🧮 Grading Scale

| Grade | Score Range | Remark    |
|-------|-------------|-----------|
| A     | 70–100      | Excellent |
| B     | 60–69       | Very Good |
| C     | 50–59       | Good      |
| D     | 45–49       | Pass      |
| E     | 40–44       | Fair      |
| F     | 0–39        | Fail      |

## 📝 Notes

- The Principal's signature is automatically embedded in every result sheet (as a styled image). To replace it with the real principal's signature, replace `public/principal-signature.png` with a transparent PNG of the actual signature.
- The first time you finalize a result for a class, position and class average are computed across all students in that class for the same term and session. Students without results are treated as having no score (not zero).

## 📞 School Contact

- **Address**: 6, Victory Avenue, Off Ikare/Akungba Road, Adjacent New Garage, Oke-Igbede, Ikare Akoko, Ondo State
- **Tel**: 08134033219, 08063681454
- **Email**: godgenerals1@gmail.com
- **Motto**: For Development & Academic Excellence

---

Built for God Generals Standard Academy.
