// Central place for the backend API URL.
// In production (Vercel), set REACT_APP_API_URL in your project's Environment Variables
// to your live backend URL, e.g. https://your-backend.onrender.com
// Locally, it falls back to your local backend on port 5000.
export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
