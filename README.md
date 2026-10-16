
# Finora — Bank Transaction System

A full-stack banking simulation application built to demonstrate secure authentication, account management, and transaction processing through a modern web interface.

## Live Demo

- **Frontend:** https://finora-flame.vercel.app/
- **Backend API:** https://finora-backend-zznq.onrender.com

> Note: The backend is hosted on Render's free tier and may take a little time to respond after periods of inactivity.

## Features

- User registration and login
- Cookie-based authentication using JWT
- Protected account and transaction routes
- Account dashboard with balance and account details
- Credit and debit operations
- Money transfer functionality
- Transaction history and transaction summaries
- Input validation and error handling
- MongoDB database integration
- Responsive web interface

## Tech Stack

**Frontend**
- React
- Vite
- Tailwind CSS
- JavaScript

**Backend**
- Node.js
- Express.js
- REST API
- JWT authentication
- HTTP-only cookies

**Database and Deployment**
- MongoDB Atlas
- Vercel — frontend hosting
- Render — backend hosting
- Git and GitHub — version control

## Architecture

The application follows a client-server architecture.

1. The React frontend sends HTTP requests to the Express backend.
2. The backend validates requests and authenticates users.
3. Mongoose communicates with MongoDB Atlas to access application data.
4. The API returns responses that the frontend uses to update the dashboard and transaction views.

## Run Locally

### Prerequisites

- Node.js and npm
- A MongoDB database
- Git

### 1. Clone the repository

```bash
git clone https://github.com/ayush-verma-dev/Finora.git
cd Finora
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory using the variable names required by your backend configuration.

Example:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret_at_least_32_characters
FRONTEND_URL=http://localhost:5173
```

Use your own local database connection string and a secure, randomly generated JWT secret. Never commit `.env` files or real credentials to GitHub.

### 3. Start the backend

```bash
npm run dev
```

### 4. Configure and start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

If the frontend requires an API base URL, configure it according to the frontend's environment-variable setup. For local development, use the backend address and port configured on your machine.

Open the local URL printed by Vite in your terminal.

## Deployment

- Deploy the frontend to Vercel.
- Deploy the backend as a web service on Render.
- Configure production environment variables in the hosting dashboard.
- Set the backend's `FRONTEND_URL` to the deployed frontend origin.
- Configure `VITE_API_URL` for the deployed frontend to point to the backend URL.
- Ensure the production database and authentication settings are configured correctly.

## Security Notes

- Authentication uses HTTP-only cookies.
- Keep database credentials and JWT secrets out of source control.
- Use HTTPS for production deployments.
- Validate inputs and handle unauthorized requests appropriately.

## Future Improvements

- Automated tests for authentication and transaction workflows
- Improved transaction filtering and pagination
- More detailed analytics and reporting
- Additional deployment monitoring and logging

## Author

**Ayush Verma**

- GitHub: https://github.com/ayush-verma-dev

---

Built as a full-stack development project to practice backend APIs, database integration, authentication, transaction processing, and deployment.
