# Blood Request and Donor Matching System

A full-stack application for posting blood requests and finding registered donors by blood group and location.

## Tech stack

- React + Vite frontend
- Node.js + Express REST API
- MongoDB + Mongoose

## Requirements

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection string

## Setup

1. Install dependencies from the project root:

   ```bash
   npm run install:all
   ```

2. Create `backend/.env` from `backend/.env.example` and set `MONGODB_URI` if needed.
3. Start MongoDB, then run from the root:

   ```bash
   npm run dev
   ```

The frontend runs at `http://localhost:5173` and the API at `http://localhost:5000`.

## Features

- Create, search, edit, and remove donor profiles.
- Search donors by blood group and city/location; filter by availability.
- Post, view, edit, update the status of, and delete blood requests.
- Request and donor form validation, API error handling, and responsive layouts.
- Donor contact links and request urgency/status indicators.

## API

- `GET /api/health`
- `GET|POST /api/donors`
- `GET|PUT|PATCH|DELETE /api/donors/:id`
- `GET|POST /api/requests`
- `GET|PUT|PATCH|DELETE /api/requests/:id`
