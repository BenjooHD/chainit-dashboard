# ChainIt Dashboard

Professional task and project management platform for ChainIt Technologies. Built with Next.js, React, and Tailwind CSS.

## Features

### Dashboard
- **Overview statistics** - Total tasks, open, in-progress, and completed counts
- **Team workload distribution** - Visual breakdown of task allocation across Ben, Joona, and Noah
- **Alerts** - Automatic highlighting of overdue tasks and high-priority items
- **Recent tasks** - Quick view of latest activity

### Tasks
- **Create and manage tasks** - Full CRUD operations with intuitive form
- **Task assignment** - Assign tasks to Ben, Joona, Noah, or leave unassigned
- **Priority levels** - Low, Medium, High priority classification
- **Due dates** - Track deadlines with visual overdue indicators
- **Task status** - Open, In Progress, Completed workflow
- **Bucket/Category system** - Organize tasks by category (Development, Design, Marketing, Business)
- **Task notes** - Add detailed notes and descriptions to tasks
- **Status grouping** - View tasks organized by their current status
- **Task details** - Click "Details" to view full notes and information
- **Edit and delete** - Modify or remove tasks as needed
- **Filtering** - Filter by assignee, status, or bucket category

### Brainstorming
- **Idea capture** - Add new ideas and strategies with descriptions
- **Category organization** - Categorize ideas (Features, Improvements, Business, Marketing)
- **Voting system** - Upvote ideas to prioritize discussions
- **Author attribution** - Track who proposed each idea
- **Category filtering** - View ideas by category or all at once
- **Sorted by popularity** - Ideas automatically sorted by vote count

## Getting Started

### Installation

```bash
cd "/Users/noahdyck/Documents/ChainIt Dashboard"
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx         # Root layout with global styles
│   ├── page.tsx           # Home page component
│   └── globals.css        # Tailwind CSS configuration
├── components/
│   ├── Dashboard.tsx      # Main dashboard container
│   ├── Sidebar.tsx        # Navigation sidebar
│   ├── TaskForm.tsx       # Task creation/editing form
│   ├── TaskCard.tsx       # Individual task display component
│   ├── TaskList.tsx       # Task grouping and display
│   ├── TaskFilters.tsx    # Filter controls
│   └── views/
│       ├── DashboardView.tsx       # Dashboard statistics and overview
│       ├── TasksView.tsx           # Tasks management interface
│       └── BrainstormingView.tsx   # Brainstorming and idea tracking
└── context/
    └── TaskContext.tsx    # Global state management
```

## Technology Stack

- **Framework**: Next.js 15.5.24
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **UI Components**: Custom React components with Tailwind CSS

## Key Components

### Dashboard Component
Main container managing tab navigation and component rendering.

### TaskContext
Global state management for tasks and buckets, providing:
- Task CRUD operations
- Bucket management
- Task status toggling
- State persistence across components

### Views
Three main view components:
1. **DashboardView** - Statistics, team workload, and alerts
2. **TasksView** - Task management with filtering
3. **BrainstormingView** - Idea tracking and voting

## Workflow

### Creating a Task
1. Click "New Task" in the Tasks view
2. Fill in title, description, assignee, priority, due date, bucket, and notes
3. Click "Create Task"

### Managing Tasks
- **Check off**: Click checkbox to advance task status (Open → In Progress → Completed)
- **View details**: Click "Details" to see full notes
- **Edit**: Click "Edit" to modify task information
- **Delete**: Click "Delete" to remove a task

### Filtering Tasks
Use the filter controls to view:
- Tasks assigned to specific team members
- Tasks by status (Open, In Progress, Completed)
- Tasks by bucket/category

### Brainstorming
1. Click "New Idea" to add a strategy or feature concept
2. Fill in title, description, category, and author
3. Click "Add Idea"
4. Vote on ideas to prioritize discussions
5. Ideas are automatically sorted by popularity

## Color Scheme

Professional slate-based design with blue accents:
- Background: Slate-50
- Primary: Blue-600
- Status indicators: Green (completed), Blue (in-progress), Slate (open)
- Alerts: Red for high priority and overdue
- Priority: Low (Blue), Medium (Amber), High (Red)

## Browser Compatibility

Works on all modern browsers supporting ES2020 and CSS Grid/Flexbox.

## Future Enhancements

- Database persistence with Prisma/PostgreSQL
- Real-time collaboration features
- Custom status workflows
- Advanced reporting and analytics
- Export functionality (CSV, PDF)
- Calendar view for deadline management
- Team activity timeline
- Task comments and mentions

---

Built with care for the ChainIt Technologies team.
