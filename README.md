# Ascending Fitness v3.0.0

Ascending Fitness is a comprehensive fitness management platform that connects trainers with clients, offering personalized fitness tracking and management tools.

## New in v3.0.0 - PostgreSQL Migration

- **Persistent Database**: Migrated from SQLite to PostgreSQL for true data persistence
- **Scalability**: Enhanced to support multiple concurrent users efficiently
- **Reliability**: PostgreSQL ensures data integrity and prevents loss during deployments
- **Performance**: Optimized queries and indexing for faster response times
- **Enterprise Ready**: Built for professional fitness operations with advanced features

## Features

- **Secure Authentication**: JWT-based authentication with role-based access
- **User Profiles**: Comprehensive profile management with fitness and health information
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, professional interface with intuitive navigation
- **Health Tracking**: Detailed health and fitness information management
- **Emergency Contacts**: Secure storage of emergency contact information

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt password hashing
- **Deployment**: Railway compatible

## Installation

1. Clone the repository:
```bash
git clone https://github.com/realcoachap/AF3.git
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your PostgreSQL connection details
```

4. Start the development server:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

## Database Schema

The application uses two main tables:

### users table
- id (SERIAL PRIMARY KEY)
- name (VARCHAR)
- email (VARCHAR UNIQUE)
- password (VARCHAR)
- role (VARCHAR DEFAULT 'client')
- phone (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### profiles table
- user_id (INTEGER PRIMARY KEY REFERENCES users)
- Personal information fields (age, height, weight, gender)
- Health information fields (medicalConditions, medications, etc.)
- Fitness information fields (fitnessLevel, goals, etc.)
- Emergency contact fields

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate user
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update user profile
- `GET /api/health` - Health check endpoint

## Deployment

The application is optimized for Railway deployment with PostgreSQL plugin:

1. Create a new Railway project
2. Add the PostgreSQL plugin
3. Set environment variables in Railway dashboard
4. Deploy from this repository

## Security Features

- Passwords are hashed using bcrypt
- JWT tokens with expiration
- Input validation and sanitization
- SQL injection prevention through parameterized queries
- Role-based access control

## License

MIT License - see LICENSE file for details