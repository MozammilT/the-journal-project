# the-journal-project

A public blogging website where anyone can sign up, log in, and start sharing their thoughts. Users can create, edit, and delete their own blog posts, which are visible to everyone.

 ⚠️ **Note**: This project is still in active development. Features may change and bugs may exist.

## ✨ Features

- User registration and login (Local & Google OAuth)
- Password encryption using `bcrypt`
- Create, edit, and delete blog posts
- Authors can only modify or delete **their own** posts
- Clean and simple EJS-based frontend
- Session handling and authentication with `Passport.js`

## 🛠️ Tech Stack

- **Frontend**: EJS templating, HTML/CSS
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: Passport.js (Local + Google OAuth)
- **Security**: `bcrypt` for password hashing

## 📦 Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/the-journal-project.git
cd the-journal-project
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup `.env` file

Create a .env file in the root directory and add the following variables:

```env
API_URL=http://localhost:1000
SESSION_SECRET=your_session_secret

PG_USER=your_pg_username
PG_HOST=localhost
PG_DATABASE=journal
PG_PASSWORD=your_db_password
PG_PORT=5432

SALT_ROUNDS=10  # Number of bcrypt salt rounds for hashing passwords

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password  # App Password for sending welcome emails
```

### 4. Set up PostgreSQL

- Create a database named journal (or use the name provided in your `.env`).

- Create the follwing tables

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50),
  email VARCHAR(50),
  password VARCHAR(1000)
);

CREATE TABLE journal (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  content TEXT,
  author VARCHAR(100),
  date VARCHAR(20)
);
```

## 5. Configure Google Console

- Visit [Google Cloud Console](https://console.cloud.google.com/welcome?project=my-journal-project-453609)
- Create a project and enable OAuth consent screen
- Add the following redirect URI:

```bash
http://localhost:2000/auth/google/home
```

🔗 Need help? Follow this [Youtube tutorial](https://www.youtube.com/watch?v=tgO_ADSvY1I) on setting up Google OAuth.

### 6. Run the app

In two separate terminals:

```bash
# Terminal 1 - Frontend (port 1000)
node index.js
```

```bash
# Terminal 2 - Backend/API (port 2000)
node server.js
```

Visit http://localhost:1000 to use the app.

## ✅ Future Improvements

- Redesign the homepage for a more modern and intuitive user experience.
- Add an option for users to publish blog posts publicly or keep them private.

## 🚧 Deployment

Deployment is not yet live, but planned for future release.

## 👤 Author

Built with ❤️ by [Mozammil Tarique](https://github.com/MozammilT)
