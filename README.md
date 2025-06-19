# Book Application

A full-stack web application for managing and exploring books. This project uses Django REST Framework for the backend API with JWT authentication and MySQL database.

## Project Structure

```
Book_Application/
├── backend/              # Django backend
│   ├── api/             # REST API endpoints
│   ├── backend/         # Django project settings
│   ├── manage.py        # Django management script
│   ├── requirements.txt # Python dependencies
│   └── .gitignore      # Git ignore rules
```

## Tech Stack

### Backend
- Django 4.2
- Django REST Framework 3.14.0
- MySQL Database
- JWT Authentication
- CORS Headers support

## Backend Setup

1. Install MySQL if not already installed
   - Download and install MySQL Server
   - Create a new database:
     ```sql
     CREATE DATABASE book_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
     ```

2. Navigate to the backend directory:
   ```bash
   cd backend
   ```

3. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

4. Activate the virtual environment:
   - Windows:
     ```bash
     .\venv\Scripts\activate
     ```
   - Linux/Mac:
     ```bash
     source venv/bin/activate
     ```

5. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

6. Create .env file in the backend directory:
   ```
   DEBUG=True
   SECRET_KEY=your-secret-key-here
   
   # Database settings
   DB_NAME=book_db
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_HOST=localhost
   DB_PORT=3306
   
   # JWT Settings
   JWT_ACCESS_TOKEN_LIFETIME=5
   JWT_REFRESH_TOKEN_LIFETIME=1
   ```

7. Apply migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

8. Create a superuser (admin):
   ```bash
   python manage.py createsuperuser
   ```

9. Start the development server:
   ```bash
   python manage.py runserver
   ```

## API Authentication

The API uses JWT (JSON Web Token) authentication. To authenticate:

1. Obtain tokens:
   ```bash
   POST /api/token/
   {
     "username": "your_username",
     "password": "your_password"
   }
   ```

2. Response will contain:
   ```json
   {
     "access": "access_token",
     "refresh": "refresh_token"
   }
   ```

3. Use the access token in headers:
   ```
   Authorization: Bearer <access_token>
   ```

4. Refresh token:
   ```bash
   POST /api/token/refresh/
   {
     "refresh": "your_refresh_token"
   }
   ```

## API Endpoints

- Authentication:
  - POST /api/token/ - Obtain JWT tokens
  - POST /api/token/refresh/ - Refresh JWT token
  - POST /api/token/verify/ - Verify JWT token

## Features

- Secure JWT Authentication
- MySQL Database integration
- RESTful API endpoints
- Cross-Origin Resource Sharing (CORS) support
- Token-based authorization
- Customizable user roles and permissions

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the MIT License. 