# Professional Full-Stack E-Commerce Portfolio

A robust, production-graded E-Commerce application built to demonstrate mastery of full-stack fundamentals: **React, Node.js + Express, and PostgreSQL** (without ORMs).

## 🚀 Key Features

*   **Full-Stack Architecture**: Clean MVC Backend and Component-based Frontend (Vite).
*   **Database Design**: Relational schema with PostgreSQL (Users, Products, Orders, OrderItems).
*   **Authentication**: Secure session-based authentication using `express-session`, `cookie`, and `bcrypt` encryption.
*   **Transaction Management**: ACID-compliant order processing using SQL transactions (BEGIN/COMMIT/ROLLBACK) to ensure data integrity.
*   **State Management**: React Context API for Global Auth and Shopping Cart state.
*   **Web3 Integration**: "Digital Receipt" feature using **MetaMask** and mock blockchain hashing to demonstrate Web3 concepts.
*   **Admin Dashboard**: Protected routes for product and order management.

## 🛠 Tech Stack & Design Decisions

### Frontend: React.js (Vite)
*   **Why Vite?**: Faster build times and modern ESM support compared to CRA.
*   **No Redux?**: Used **Context API** because the state requirements (Auth, Cart) are global but not complex enough to warrant the boilerplate of Redux. This reduces bundle size and complexity.
*   **Bootstrap 5**: Chosen for rapid, responsive UI development without the build overhead of Tailwind (per project constraints).

### Backend: Node.js + Express
*   **MVC Pattern**: Separated concerns into `Models` (DB), `Controllers` (Logic), and `Routes` (API Definition) for maintainability.
*   **Raw SQL (pg)**: Deliberately chose `pg` over an ORM (like Sequelize/TypeORM) to demonstrate **SQL proficiency**, performance optimization control, and understanding of underlying database interactions.

### Database: PostgreSQL
*   **Relational Schema**: Perfectly suited for structured transactional data like Orders and Inventory.
*   **Data Integrity**: Foreign keys and constraints ensure robust data relationships.

## ⚙️ Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL installed and running locally.

### 1. Database Setup
Create the database and seed initial data:
```bash
# In the root directory (or /server)
cd server
cp .env.example .env # (Create .env based on example)
node db/setup.js
```
*Note: Ensure your `.env` contains correct DB credentials (`DATABASE_URL`).*

### 2. Backend Setup
```bash
cd server
npm install
npm run dev
```
Server runs on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
Client runs on `http://localhost:5173`.

### 4. Admin Access
To promote a user to admin:
```bash
node server/scripts/setAdmin.js <user-email>
```

## 🧠 Interview Q&A (The "Why")

### Q: Why did you choose Session Auth over JWT?
**A:** Sessions are stateful and stored on the server (via Redis/Memory), allowing instant revocation (e.g., banning a user). JWTs are stateless; once issued, they are valid until expiration unless complex blocklisting is implemented. For a secure e-commerce site, session control is often preferred.

### Q: How does data flow from React to the Database?
**A:** 
1.  **User Action**: User clicks "Checkout" in React.
2.  **API Call**: Axios sends a POST request to `/api/orders` with cart data.
3.  **Route/Controller**: Express receives the request; Controller validates input.
4.  **Transaction**: Model opens a Postgres client, starts a transaction (`BEGIN`).
5.  **SQL Execution**: Inserts Order -> Inserts Items -> Updates Stock.
6.  **Commit**: If all succeed, `COMMIT`. If any fail, `ROLLBACK`.
7.  **Response**: Server sends success status back to React to update UI.

### Q: How would you scale this application?
**A:** 
*   **Database**: Implement Read Replicas for `SELECT` heavy queries (Catalog browsing). Use Connection Pooling (`pg-pool`).
*   **Backend**: Stateless (if switched to JWT or external Session Store like Redis) allows horizontal scaling behind a Load Balancer (Nginx).
*   **Frontend**: CDN for serving static assets and images.
*   **Caching**: Redis for caching frequent product queries.

## 🔒 Security Measures
*   **Password Hashing**: `bcrypt` with salt.
*   **Route Protection**: Middleware (`isAuthenticated`, `isAdmin`) verifies session before access.
*   **Input Handling**: Parameterized queries prevent SQL Injection.
