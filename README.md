# Book Application

A full-stack digital library platform built with Django REST Framework and React. The project supports reader and admin roles, book browsing, PDF reading, review management, reading progress tracking, and AI-assisted book features such as summaries, analytics, and audio generation.

## Overview

This project is split into two main parts:

- `backend/`: Django + Django REST Framework API
- `frontend/`: React + Vite single-page application

The application is designed for:

- Readers who want to browse books, read PDFs, track progress, and leave reviews
- Admins who want to upload books, manage the catalog, and moderate reviews

## Key Features

### Reader features

- User registration and login with JWT authentication
- Browse all books and view detailed book pages
- Search books by title, author, and genre
- Open protected PDF reader pages after login
- Track reading and audio progress in a personal library
- Submit ratings and written reviews
- Get book recommendations based on reading history
- View AI-generated summaries and summary audio
- View book analytics such as word count, reading time, audio duration, and top keywords

### Admin features

- Admin-only dashboard
- Upload books with cover images and PDF files or URLs
- Update and delete books
- View and delete reader reviews
- Manage the catalog from a dedicated frontend workspace

### AI and media features

- Extract text from uploaded or linked PDFs
- Generate AI summaries for books
- Generate chapter-level audio from selected page ranges
- Generate full-book audio for smaller texts
- Cache generated audio files for reuse

## Tech Stack

### Frontend

- React 18
- Vite
- React Router
- Tailwind CSS
- Framer Motion

### Backend

- Django 4.2
- Django REST Framework
- Simple JWT
- MySQL
- django-cors-headers

### AI and document processing

- OpenAI Python SDK
- Transformers
- PyMuPDF
- gTTS
- EbookLib

## Project Structure

```text
Book_Application/
|-- backend/
|   |-- api/                 # Models, serializers, views, routes
|   |-- backend/             # Django settings, URLs, WSGI/ASGI
|   |-- manage.py
|   `-- requirements.txt
|-- frontend/
|   |-- src/
|   |   |-- components/      # Reusable UI components
|   |   |-- context/         # Global app state
|   |   |-- data/            # API helpers and mock data
|   |   `-- pages/           # Route-level pages
|   |-- package.json
|   `-- vite.config.js
`-- README.md
```

## Backend Data Model

The backend centers around four main models:

- `CustomUser`: custom authentication model with `user` and `admin` roles
- `Book`: stores metadata, cover/PDF sources, analytics, AI summary, and audio links
- `Review`: user-submitted ratings and review text for books
- `Library`: tracks user progress for PDF and audio consumption

## Main Frontend Routes

- `/`: home page
- `/books`: catalog listing
- `/books/:id`: book details, reviews, analytics, and AI summary
- `/books/:id/pdf-viewer`: authenticated PDF reading view
- `/library`: authenticated personal library
- `/admin`: admin dashboard
- `/login`: login page
- `/register`: registration page
- `/profile`: user profile page

## API Highlights

Base URL during local development:

```text
http://localhost:8000/api
```

Important endpoints:

- `POST /register/`
- `POST /login/`
- `GET /books/`
- `POST /books/` admin only
- `GET /books/<id>/`
- `PUT /books/<id>/` admin only
- `DELETE /books/<id>/` admin only
- `GET /books/search/`
- `GET /books/<id>/pdf/`
- `GET /books/<id>/text/`
- `GET /books/<id>/analytics/`
- `POST /books/<id>/chapter-audio/`
- `GET /books/<id>/ai-summary-audio/`
- `GET /books/<id>/full-audio/`
- `GET, POST /books/<book_id>/reviews/`
- `GET /reviews/` admin only
- `DELETE /reviews/<review_id>/` admin only
- `GET /library/`
- `DELETE /library/`
- `POST /library/update/`
- `GET /library/audio-progress/`
- `GET /recommendations/`
- `GET /profile/`

JWT endpoints:

- `POST /api/token/`
- `POST /api/token/refresh/`
- `POST /api/token/verify/`

## Local Setup

### 1. Clone and move into the project

```bash
git clone <your-repo-url>
cd Book_Application
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

```bash
# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
DEBUG=True
SECRET_KEY=your-secret-key

DB_NAME=book_db
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306

JWT_ACCESS_TOKEN_LIFETIME=5
JWT_REFRESH_TOKEN_LIFETIME=1

OPENAI_API_KEY=your_openai_api_key
OPENAI_SUMMARY_MODEL=gpt-5.4-mini
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=marin
```

Create the MySQL database:

```sql
CREATE DATABASE book_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Run migrations and start the backend:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend development server:

```text
http://localhost:5173
```

Backend development server:

```text
http://localhost:8000
```

## Notes and Caveats

- The backend is currently configured for MySQL in `backend/backend/settings.py`.
- CORS is open for development with `CORS_ALLOW_ALL_ORIGINS = True`.
- Media URLs are served directly from the Django project during development.
- AI features depend on optional runtime services and packages. If OpenAI credentials are missing, API-backed summary or speech generation may not work.
- The code imports `torch` for transformer-based summarization, but `torch` is not listed in `backend/requirements.txt`, so a fresh setup may require installing it separately if you want local transformer summaries.
- The frontend API helper uses `axios`, so make sure it is present in `frontend` dependencies during setup.

## Suggested Improvements

- Add a production-ready media storage strategy
- Lock down CORS and `ALLOWED_HOSTS` for deployment
- Add automated backend and frontend tests
- Add pagination for large book catalogs and review lists
- Add Docker support for one-command local setup
- Move API base URLs into environment variables


## License

This project currently does not include a dedicated license file. Add one if you plan to distribute it publicly.
