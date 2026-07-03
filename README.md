# 🗓️ AppointMe - Full-Stack Scheduling Architecture

AppointMe is a production-grade Client Portal and Scheduling SaaS built with the PERN/MERN philosophy (MySQL, Express, React, Node.js). 

It is designed to solve the "Time-Travel" and "Concurrency" problems inherent in scheduling applications, featuring dynamic timezone boundary detection, Role-Based Access Control (RBAC), and a dedicated Admin Command Center for business analytics.

## ✨ Key Features

* **Role-Based Access Control (RBAC):** Secure JWT authentication isolating standard 'Client' portals from the 'Admin' Command Center.
* **Dynamic Timezone & Boundary Logic:** An algorithm that prevents "time-travel" (booking past hours on the current day) and cleanly calculates slot durations without overlapping end-boundaries.
* **Concurrency Collision Prevention:** Database-level constraints ensuring two users cannot double-book the exact same timeslot simultaneously.
* **Admin Command Center:** A secure dashboard to manage global network telemetry, view archived logs, and toggle business days Online/Offline.
* **Business Analytics Hub:** SQL-aggregated metrics tracking total lifetime clients, booking volume, and most popular operational days.
* **Customizable Schedules:** Admins can dynamically adjust start times, end times, slot durations (15m, 30m, 45m, 60m), and lunch breaks directly from the UI.

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite, Axios, React Router, Day.js (Time manipulation).
* **Backend:** Node.js, Express.js, JSON Web Tokens (JWT), Bcrypt (Password Hashing).
* **Database:** MySQL (Relational data integrity, unique constraints, native time formatting).

## 🚀 Local Setup Instructions

Follow these steps to run the complete architecture on your local machine.

### 1. Database Configuration
1. Ensure MySQL is installed and running on your machine.
2. Open your MySQL terminal or Workbench and run the following commands to build the architecture:

```sql
CREATE DATABASE appointme_db;
USE appointme_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,         
    end_time TIME NOT NULL,
    break_start TIME NULL,
    break_end TIME NULL,
    is_active BOOLEAN DEFAULT TRUE,
    slot_duration INT DEFAULT 30
);

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guest_name VARCHAR(100) NOT NULL,
    guest_email VARCHAR(100) NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_booking_slot (booking_date, start_time) 
);

-- Inject Default Weekly Schedule
INSERT INTO availability (day_of_week, start_time, end_time, break_start, break_end, is_active, slot_duration) VALUES 
('Monday', '09:00:00', '17:00:00', '12:00:00', '13:00:00', true, 30),
('Tuesday', '09:00:00', '17:00:00', '12:00:00', '13:00:00', true, 30),
('Wednesday', '09:00:00', '17:00:00', '12:00:00', '13:00:00', true, 30),
('Thursday', '09:00:00', '17:00:00', '12:00:00', '13:00:00', true, 30),
('Friday', '09:00:00', '17:00:00', '12:00:00', '13:00:00', true, 30),
('Saturday', '09:00:00', '17:00:00', '12:00:00', '13:00:00', false, 30),
('Sunday', '09:00:00', '17:00:00', '12:00:00', '13:00:00', false, 30);
```

### 2. Environment Variables
Create a `.env` file inside the `backend` directory with your local database credentials:

```env
PORT=4000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=your_mysql_password_here
DB_NAME=appointme_db
DB_PORT=3306
JWT_SECRET=chronos_secure_key_2026
```

### 3. Installation & Execution
This project uses `concurrently` to run both the frontend and backend servers simultaneously from the root directory.

```bash
# 1. Install root dependencies
npm install

# 2. Install backend dependencies
cd backend && npm install

# 3. Install frontend dependencies
cd ../frontend && npm install

# 4. Return to root and boot both servers
cd ..
npm run dev
```

The application will automatically launch in your browser at `http://localhost:5173`. 

### 🔐 Admin Access Setup
To view the Admin Command Center and Analytics Hub:
1. Register a standard account through the frontend UI.
2. Open your MySQL terminal and run this command to upgrade your system clearance:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your_registered_email@domain.com';
```

3. Click "Disconnect" on the frontend and log back in to access the Command Center tab.
