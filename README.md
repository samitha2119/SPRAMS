# Student Project & Research Archive Management System (SPRAMS)

Welcome to **SPRAMS**! This platform was built for the **University of Vavuniya** to solve a very common problem: keeping student projects and faculty research papers organized, accessible, and searchable, all in one place instead of scattered across drive folders or email attachments.

## 🤔 What does this system do?

*   **A central home for projects & papers:** Students and lecturers can easily upload their reports, presentations, and publications. No more lost files.
*   **Smart AI summaries & keywords:** We integrated Anthropic's Claude. When you submit a project, the AI automatically reads the abstract, suggests improvements, and tags it with relevant keywords so others can find it easily.
*   **Different views for different roles:**
    *   **Students** get a dedicated workspace ("My Work") to track group milestones, upload drafts, see past versions, and view grader feedback.
    *   **Lecturers** get tools to evaluate student reports and manage their own publications.
    *   **Admins** get full control over users, logs, and archive configurations.
*   **Fast & optimized:** AI summaries are cached to keep the app snappy and minimize API fees, and logs capture errors behind the scenes so the development team can fix bugs quickly.

## 🛠 What's under the hood?

We kept the stack modern, clean, and developer-friendly:
*   **Frontend:** React 18, Vite (for blazing fast dev reloads), Tailwind CSS (for styling), and Heroicons.
*   **Backend:** Node.js & Express (a solid API foundation) connected to MongoDB via Mongoose.
*   **AI:** Anthropic SDK.
*   **Testing & utilities:** Winston for logs, Jest for backend testing, and Multer to handle uploads.

## 📦 Setting it up locally

Setting up SPRAMS on your machine takes less than 5 minutes:

### Before you begin
Make sure you have **Node.js** (v18 or newer) installed, a **MongoDB** database running (locally or on MongoDB Atlas), and an **Anthropic API Key** (optional, but needed for AI features).

### 1. Install Dependencies
Open your terminal and run:

```bash
# Set up the backend server
cd server
npm install

# Set up the frontend app
cd ../client
npm install
```

### 2. Configure Environment Variables
Create a `.env` file inside the `server` directory and configure your port, Mongo URI, JWT secret, and Anthropic API key.

### 3. Launch the App
You will need two terminal windows open to run the servers in development mode:

```bash
# Terminal 1: Run the Backend API (runs on Port 5000)
cd server
npm run dev

# Terminal 2: Run the Frontend client (runs on Port 3000)
cd client
npm run dev
```

Once running, open your browser and head to **http://localhost:3000** to see it in action!

## 🧪 Running the Tests

To make sure everything is working as expected (database models, authentication, routes), you can run the automated Jest test suite:
```bash
cd server
npm test
```

## 🛡 Keeping things safe

We care about security and reliability, so we included:
*   **Secure Headers:** Helmet protects user data and the app from common web vulnerabilities.
*   **Rate Limiting:** Prevents brute-force login attempts and API spam.
*   **Input Validation:** Form inputs are thoroughly checked before reaching the database.
*   **Error Logging:** Critical server issues are captured in `server/logs/error.log` for easy troubleshooting.

---
Made with ❤️ for the University of Vavuniya.
