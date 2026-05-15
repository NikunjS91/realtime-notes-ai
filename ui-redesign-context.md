# UI Redesign Context

## Project Overview
A real-time collaborative notes app with AI summarization. Uses Google OAuth auth, MongoDB, Socket.io for real-time sync, and NVIDIA Llama 4 for AI summaries.

---

## 1. Login.jsx
**Purpose:** Login page with Google OAuth button.

```jsx
// Full code in Login.jsx
const Login = () => {
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5001/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-[#0a192f] flex flex-col items-center justify-center">
      <div className="bg-[#112240] p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        <h1 className="text-4xl font-bold text-white mb-2">CollabNotes</h1>
        <p className="text-gray-400 mb-8">Real-time collaborative notes with AI summaries</p>
        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-3 w-full bg-white text-gray-800 font-medium py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {/* Google SVG icon */}
          Continue with Google
        </button>
      </div>
    </div>
  );
};
```

**Key Elements:**
- Dark navy background (#0a192f)
- Card with logo + tagline
- Google OAuth button

---

## 2. Layout.jsx
**Purpose:** Main app shell with sidebar (glassmorphism), note list, search, tag filters, user footer.

**Key Features:**
- Glassmorphism sidebar with animated gradient background
- Search bar with placeholder "Search notes..."
- Tag filter pills (clickable, "All" + dynamic tags)
- Note list with cards showing title, tags (max 3), preview, date
- Swipeable cards (delete/archive)
- Mobile hamburger menu + background selector button
- User profile + logout in footer

**Structure:**
```
<div className="min-h-screen flex">
  {/* Background Overlay */}
  <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />

  {/* Mobile Hamburger */}
  <button className="md:hidden ...">☰</button>

  {/* Background Selector Button */}
  <button className="fixed bottom-6 right-6 ...">+</button>

  {/* Sidebar - Glassmorphism */}
  <div className="fixed md:relative bg-white/10 backdrop-blur-lg ...">
    {/* Header: Logo + New Note Button */}
    {/* Search Input */}
    {/* Tag Filter Pills */}
    {/* Note List (scrollable) */}
    {/* User Footer */}
  </div>

  {/* Main Content Area */}
  <div className="flex-1">
    <Outlet /> {/* Renders Dashboard or NotePage */}
  </div>
</div>
```

**Theme Colors:**
- Background: #0a192f (navy)
- Sidebar: white/10 with backdrop-blur
- Active elements: green-500

---

## 3. Dashboard.jsx
**Purpose:** Empty state when no note is selected.

```jsx
const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-6">📝</div>
        <h1 className="text-2xl font-bold text-white mb-3">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-400 mb-2">
          Select a note from the sidebar to start editing
        </p>
      </div>
    </div>
  );
};
```

**Key Elements:**
- Centered emoji + welcome message
- Shows user's first name

---

## 4. NotePage.jsx
**Purpose:** Wrapper for NoteEditor with header.

**Structure:**
```
<div className="h-screen flex flex-col overflow-hidden">
  {/* Header */}
  <div className="bg-[#112240] px-6 py-3">
    <button>← Back</button>
    <button>Share (disabled)</button>
  </div>

  {/* Editor Area */}
  <div className="flex-1 overflow-hidden">
    <NoteEditor noteId={id} />
  </div>
</div>
```

---

## 5. NoteEditor.jsx
**Purpose:** Main note editing component with AI summary, tags, version history, real-time cursors.

**State:**
- title, content, tags, tagInput
- summary (AI generated), isSummarising, summaryError
- showHistory, versions, restoring
- saveStatus: 'saved' | 'saving' | 'unsaved'
- cursors (real-time collaborator presence)

**Features:**

### Toolbar (top row)
- Character count + save status indicator (animated spinner → "Saved" → "Unsaved" dot)
- "🕐 History" button
- "✨ Summarise with AI" button with loading state

### Title Input
- Large (text-3xl), bold, white text
- Blur saves to DB + refreshes note list

### Tags Section
- Inline tag pills (blue-600/50, rounded-full)
- Click × to remove
- Input to add new tags (max 10)

### Content Textarea
- Full height: `h-[calc(100vh-300px)]`
- White text, placeholder "Start writing..."
- Debounced auto-save (300ms delay)

### Summary Panel
- Appears when AI summary exists
- Purple border-left accent
- "Copy" button
- Shows bullet points

### Version History Panel
- Slide-out from right (w-72)
- Shows versions with dates
- "Restore" button per version

### Collaborator Cursors
- Fixed bottom-right
- Green pills showing other users' names

---

## 6. index.css
**Tailwind Setup:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

---

## Design Summary for Redesign

**Current Theme:**
- Primary: Navy (#0a192f), lighter navy (#112240)
- Accent: Green (#10b981), Purple (#9333ea)
- Text: White, gray-400, gray-500

**Pages to Redesign:**
1. Login — clean dark page with Google button
2. Layout/Sidebar — glassmorphism, gradient bg, note cards
3. Dashboard — centered welcome state
4. NotePage + NoteEditor — full editor with toolbar, sidebar, AI summary panel

**Key Components Needed:**
- Modern, cohesive design system
- Better visual hierarchy
- Improved typography/spacing
- Smoother interactions
- Mobile-responsive refinements