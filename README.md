# Web-Home - YanZhuShou Frontend

A modern, beautiful web interface for the **YanZhuShou Question Bank Management System**.

## Features

- 🔐 **User Authentication** - Secure login and registration with JWT tokens
- 📚 **Question Bank Management** - Create and organize question banks
- 📤 **Multiple Upload Methods** - Support for CSV, XML, and single question uploads
- 📝 **Mistake Notebook** - Track and review incorrect answers with detailed analysis
- 🎨 **Beautiful UI** - Modern gradient design with Element Plus components
- 📱 **Responsive Design** - Works on desktop and tablet devices

## Tech Stack

- **Framework**: Vue 3.5+ with Composition API
- **Language**: TypeScript
- **UI Components**: Element Plus
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite 7
- **HTTP Client**: Fetch API

## Prerequisites

- Node.js 18+ 
- YanZhuShou backend running (see [YanZhuShou](../YanZhuShou))

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:8000
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at: http://localhost:5173

### 4. Build for Production

```bash
npm run build
```

### 5. Preview Production Build

```bash
npm run preview
```

## Project Structure

```
Web-Home/
├── public/
│   └── favicon.svg          # Application favicon
├── src/
│   ├── assets/              # Static assets
│   ├── components/          # Vue components
│   │   ├── AuthView.vue     # Login/Register page
│   │   ├── ProfileView.vue  # User profile management
│   │   ├── QuestionBankView.vue  # Question bank CRUD
│   │   ├── UploadQuestions.vue   # File upload interface
│   │   └── MistakeNotebook.vue   # Mistake tracking
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   ├── utils/
│   │   └── api.ts           # API client utilities
│   ├── App.vue              # Root component
│   ├── main.ts              # Application entry point
│   └── style.css            # Global styles
├── index.html               # HTML template
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
└── README.md                # This file
```

## API Integration

This frontend is designed to work with the YanZhuShou FastAPI backend.

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users/register` | POST | Register new user |
| `/users/login` | POST | Login and get JWT token |
| `/users/me` | GET | Get current user info |
| `/users/me` | PUT | Update current user |
| `/question_banks/book` | POST | Create question bank |
| `/upload/csv` | POST | Upload CSV file |
| `/upload/xml` | POST | Upload XML file |
| `/upload/question` | POST | Upload single question |

### Configuration

Update the API URL in `.env`:

```env
VITE_API_URL=http://your-backend-url:8000
```

## Usage Guide

### 1. Register/Login

- Create a new account or login with existing credentials
- JWT token is stored in localStorage for session persistence

### 2. Profile Management

- View and edit your profile information
- Update name, phone, and gender

### 3. Question Banks

- Create new question banks with name and description
- Set visibility (public/private)
- View questions within each bank

### 4. Upload Questions

**CSV Upload:**
- Prepare CSV with columns: category, stem, qus_type, options, correct_ans_summary, etc.
- Drag and drop or select file
- Choose target question bank

**XML Upload:**
- Follow the XML schema documented in YanZhuShou backend
- Upload similar to CSV

**Single Question:**
- Fill in the form with question details
- Select question type (Essay, Single Choice, Multiple Choice, Fill-in)
- Add options for choice questions

### 5. Mistake Notebook

- Record wrong answers with detailed analysis
- Categorize by subject and error type
- Track progress with status (New, Reviewing, Mastered)
- Set difficulty levels

## Screenshots

### Login Page
Beautiful gradient design with smooth transitions.

### Dashboard
Collapsible sidebar with intuitive navigation.

### Question Bank Management
Two-panel layout for banks and questions.

### Mistake Notebook
Rich cards with status tracking and analysis.

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Build
npm run build        # Build for production
npm run preview      # Preview production build

# Type Check
npm run type-check   # Run TypeScript type checking
```

### Code Style

- TypeScript strict mode enabled
- ESLint rules via Vite plugins
- Tailwind CSS for styling
- Element Plus for components

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### CORS Issues

Ensure your backend has CORS enabled:

```python
# In FastAPI main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### API Connection Failed

1. Check if backend is running: `http://localhost:8000/docs`
2. Verify `.env` file has correct `VITE_API_URL`
3. Check browser console for errors

## License

Proprietary - All rights reserved.

## Support

For issues related to:
- **Frontend**: Check this Web-Home repository
- **Backend**: See [YanZhuShou](../YanZhuShou) repository

---

<div align="center">

**YanZhuShou - Smart Learning Platform**

Built with ❤️ using Vue 3 + TypeScript + Element Plus

</div>
