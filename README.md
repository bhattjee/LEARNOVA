# Learnova

A modern eLearning platform with a React (Vite + TypeScript) frontend and FastAPI backend.

## Features

- **Role-based access control** for Admins, Instructors, and Learners
- **Course management** with lessons, quizzes, and progress tracking
- **Gamification system** with points and achievements
- **Video lesson player** with progress tracking
- **Review and rating system** for courses
- **Responsive design** with modern UI using TailwindCSS
- **JWT authentication** with secure token handling
- **File upload support** for course content
- **Email notifications** via Resend

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Zustand** for state management
- **Radix UI** components
- **Lucide React** icons

### Backend
- **FastAPI** for the REST API
- **SQLAlchemy** with async support
- **PostgreSQL** database
- **Alembic** for database migrations
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Pydantic** for data validation
- **Resend** for email services
- **Cloudflare R2** for file storage (configurable)

## Project Structure

```
LEARNOVA/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service layer
│   │   ├── stores/       # State management
│   │   ├── hooks/        # Custom React hooks
│   │   ├── types/        # TypeScript type definitions
│   │   └── router/       # Route configuration
│   └── package.json
├── backend/           # FastAPI backend application
│   ├── app/
│   │   ├── routers/      # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── models/       # Database models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── core/         # Core configuration
│   │   └── middleware/   # Custom middleware
│   ├── alembic/          # Database migrations
│   └── requirements.txt
├── website/           # Static marketing site
│   ├── screenshots/      # UI screenshots
│   └── tour.html         # Interactive tours
├── docs/              # Documentation
└── Screenshots/       # Source screenshots
```

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.11 or higher)
- **PostgreSQL** (v14 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LEARNOVA
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb learnova
   
   # Run migrations
   alembic upgrade head
   
   # Seed default accounts
   python seed.py
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your backend URL
   ```

5. **Run the Application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

### Default Accounts

After running `seed.py`, you can use these accounts:

- **Admin**: admin@learnova.com / Admin123!
- **Instructor**: instructor@learnova.com / Instructor123!
- **Learner**: learner@learnova.com / Learner123!

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/learnova
JWT_SECRET_KEY=your-super-secret-key-minimum-32-characters
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=50
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
STORAGE_TYPE=local
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
RESEND_API_KEY=
EMAIL_FROM=noreply@learnova.local
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Learnova
```

## Demo Data

For development and testing, you can load realistic demo data:

```bash
cd backend
python demo_seed.py  # Full reset with realistic data
python seed_bulk.py  # Load testing data (hundreds of rows)
python cleanup_bulk_seed.py  # Remove bulk seed data
```

## Documentation

- [Directory Structure](DIRECTORY_STRUCTURE.md)
- [Security Configuration](.security)
- [R2 Storage Setup](docs/r2-storage-setup.md)
- [Email Setup](docs/resend-email-setup.md)

## Security

This project follows security best practices:

- **No credentials in code** - All secrets stored in environment variables
- **Password hashing** with bcrypt (12 rounds)
- **JWT authentication** with secure token handling
- **CORS protection** with configurable origins
- **Input validation** via Pydantic schemas
- **SQL injection prevention** using SQLAlchemy ORM
- **XSS protection** with content sanitization
- **Rate limiting** on sensitive endpoints

See `.security` file for detailed security configuration.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure they pass
5. Submit a pull request

## Support

For issues and questions, please open an issue on GitHub.
