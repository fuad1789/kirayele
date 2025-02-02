# Backend API Documentation

This is the backend server for the Kirayele application. It provides authentication and user management functionality through a RESTful API.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

   - Copy `.env.example` to `.env`
   - Fill in the required environment variables:
     - `MONGODB_URI`: MongoDB connection string
     - `PORT`: Server port (default: 5000)
     - `RECAPTCHA_SECRET_KEY`: Google reCAPTCHA secret key
     - `ACCESS_TOKEN_SECRET`: JWT access token secret
     - `REFRESH_TOKEN_SECRET`: JWT refresh token secret

3. Generate JWT keys (if not already present):

```bash
node scripts/generateKeys.js
```

4. Start the server:

```bash
npm start
```

## API Endpoints

### Authentication Routes (`/auth`)

All authentication routes are rate-limited and require reCAPTCHA verification.

#### POST /auth/send-otp

Send OTP verification code to phone number.

**Request Body:**

```json
{
  "phoneNumber": "string",
  "recaptchaToken": "string"
}
```

**Response:**

- 200: Success
- 400: Invalid input or reCAPTCHA
- 403: Account blocked/locked

#### POST /auth/verify-otp

Verify OTP and authenticate user.

**Request Body:**

```json
{
  "idToken": "string",
  "recaptchaToken": "string"
}
```

**Response:**

- 200: Success with tokens
- 400: Invalid input
- 403: Authentication failed

### Protected Routes

These routes require a valid JWT access token in the Authorization header.

#### GET /protected/me

Get user profile information.

**Response:**

- 200: User profile data
- 404: User not found

#### PUT /protected/me

Update user profile information.

**Request Body:**

```json
{
  "firstName": "string",
  "lastName": "string"
}
```

**Response:**

- 200: Updated user data
- 404: User not found

#### GET /protected/settings

Get user settings and preferences.

**Response:**

- 200: User settings data
- 404: User not found

## Security Features

- Rate limiting on authentication routes
- reCAPTCHA verification
- JWT-based authentication
- Account locking after multiple failed attempts
- Helmet security headers
- CORS protection

## Error Handling

The API returns appropriate HTTP status codes and error messages in the following format:

```json
{
  "message": "Error description"
}
```

## Development

The server uses the following main dependencies:

- Express.js for the web framework
- MongoDB with Mongoose for the database
- Firebase Admin SDK for phone authentication
- JWT for token-based authentication
- Express Rate Limit for rate limiting
- Helmet for security headers

## Environment Variables

See `.env.example` for all required environment variables and their descriptions.
