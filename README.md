# Colab-Hub

## Local Setup and Installation

Clone the repository:

```bash
git clone https://github.com/[your-username]/Colab-Hub.git
```

Install dependencies in both the **server** and **client** directories using npm:

```bash
cd server && npm install
cd ../client && npm install
```

## Environment Configuration

Create a `.env` file in the `server` directory. Define the following variables (adjust values to match your environment):

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/colab-hub
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
BOT_USER_ID=your_bot_user_id
```

Ensure a local **MongoDB** instance is running if you use the default `MONGODB_URI` above, or point `MONGODB_URI` to your own cluster connection string. `BOT_USER_ID` should be a valid `User` document ObjectId in your database (used to post ColabBot messages).

## Running the System Locally

Start the backend (from the project root or `server`):

```bash
cd server && npm start
```

Start the frontend (Vite dev server):

```bash
cd client && npm run dev
```

- The **web app** is available at [http://localhost:3000](http://localhost:3000) (Vite’s default in this project).
- The **API and Socket.io server** listens at [http://localhost:5001](http://localhost:5001).

## ColabBot Interaction

In a workspace, open the **Chat** tab and type **`@ColabBot`** followed by your question (e.g. planning help or a summary). The assistant replies in the same thread. A **valid Gemini API key** (`GEMINI_API_KEY` in `server/.env`) is required; without it, bot replies will not work as configured.
