// ================= IMPORT DEPENDENCIES =================
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import session from "express-session";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import dotenv from "dotenv";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import nodemailer from "nodemailer";

// ================= CONFIG SETUP =================
dotenv.config();
const app = express();
const port = 2000;
const saltRounds = 10;
const API_URL = process.env.API_URL;

// ================= DATABASE SETUP =================
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

// ================= EMAIL SETUP =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendWelcomeEmail = (toEmail, username) => {
  const formattedUsername =
    username.charAt(0).toUpperCase() + username.slice(1);
  const mailOptions = {
    from: `\"Inkspire\" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Welcome to ThoughtNest 💫",
    html: `<!DOCTYPE html>
          <html lang="en" style="margin:0; padding:0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
              <title>Welcome Email</title>
            </head>
            <body style="background-color:#f4f4f4; margin:0; padding:0;">
              <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:auto; background-color:#ffffff; box-shadow:0 0 10px rgba(0,0,0,0.1); border-radius:10px; overflow:hidden;">
                <tr>
                  <td style="background-color:#4a90e2; padding:30px; text-align:center; color:#fff;">
                    <h1 style="margin:0; font-size:28px;">Welcome to Our Blog!</h1>
                    <p style="margin:5px 0 0; font-size:16px;">We're glad to have you here</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px; color:#333;">
                    <p style="font-size:16px;">Hi <strong>${formatterUserName}</strong>,</p>
                    <p style="font-size:16px; line-height:1.6;">
                      Welcome to The Blog Project! We're so glad to have you here. 📝
                      Thank you for signing up to our blogging platform. 🎉 <br/>
                      You’ve just joined a passionate community of writers, thinkers, and creators.
                    </p>
                    <p style="font-size:16px; line-height:1.6;">
                      Here’s what you can do next:
                      <ul style="padding-left: 20px;">
                        <li>✍️ Start writing your first blog post</li>
                        <li>👀 Explore posts from other creators</li>
                        <li>📩 Connect and share your thoughts</li>
                      </ul>
                    </p>
                    <p style="font-size:16px;">Let’s build something awesome together.</p>
                    <p style="font-size:16px;">Cheers, <br/> The Blog Team</p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#f0f0f0; text-align:center; padding:20px; font-size:12px; color:#777;">
                    © 2025 Blog Platform. All rights reserved.
                  </td>
                </tr>
              </table>
            </body>
          </html>`,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error("Error sending welcome email:", error);
    else console.log("Welcome email sent:", info.response);
  });
};

// ================= MIDDLEWARE =================
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ================= PASSPORT LOCAL STRATEGY =================
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const result = await db.query("SELECT * FROM users WHERE username = $1", [
        username,
      ]);
      if (result.rows.length === 0) return done(null, false);

      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (match) return done(null, user);
      else return done(null, false);
    } catch (err) {
      return done(err);
    }
  })
);

// ================= PASSPORT GOOGLE STRATEGY =================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:2000/auth/google/home",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const username =
          profile.displayName.toLowerCase().split(" ").slice(0, -1).join(" ") ||
          profile.given_name.toLowerCase();
        let user = await db.query("SELECT * FROM users WHERE username = $1", [
          username,
        ]);

        if (user.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
            [username, profile.email, profile.id]
          );
          return done(null, newUser.rows[0]);
        } else {
          return done(null, user.rows[0]);
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ================= SERIALIZE / DESERIALIZE =================
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rows.length > 0) done(null, result.rows[0]);
    else done(new Error("User not found"));
  } catch (err) {
    done(err);
  }
});

// ================= ROUTES =================
app.get("/", (req, res) => {
  const errorMessage = req.query.error || null;
  res.render("login.ejs", { errorMessage });
});

app.get("/home", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const response = await axios.get(`${API_URL}/posts`);
      res.render("index.ejs", {
        posts: response.data,
        loggedInUser: req.user.username,
      });
      // console.log("Logged in as: ", req.user.username);
      // console.log("Fetched Posts:", response.data);
    } catch (err) {
      res.status(500).json({ message: "Error fetching posts" });
    }
  } else {
    res.redirect("/");
  }
});

app.get("/register", (_, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existing = await db.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    if (existing.rows.length > 0)
      return res.send("User already exists. Try logging in");

    const hash = await bcrypt.hash(password, saltRounds);
    const result = await db.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hash]
    );

    const user = result.rows[0];
    // sendWelcomeEmail(email, username);
    req.login(user, (err) => {
      if (err) throw err;
      res.redirect("/home");
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/login", (req, res) => res.redirect("/"));

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect:
      "/?error=Wrong%20username%20or%20password,%20please%20try%20again",
  })
);

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/home",
  passport.authenticate("google", {
    successRedirect: "/home",
    failureRedirect: "/",
  })
);

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

app.get("/new", (req, res) => {
  res.render("modify.ejs", {
    heading: "New Journal",
    submit: "Create Journal",
    username: req.user,
  });
});

app.get("/edit/:id", async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/posts/${req.params.id}`);
    res.render("modify.ejs", {
      heading: "Edit Journal",
      submit: "Save Changes",
      post: response.data,
      username: req.user,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching post" });
  }
});

app.post("/posts", async (req, res) => {
  try {
    const { title, content } = req.body;
    const author = req.user.username;
    await axios.post(`${API_URL}/posts`, { title, content, author });
    res.redirect("/home");
  } catch (err) {
    res.status(500).json({ message: "Error creating post" });
  }
});

app.post("/posts/:id", async (req, res) => {
  try {
    await axios.patch(`${API_URL}/posts/${req.params.id}`, req.body);
    res.redirect("/home");
  } catch (err) {
    res.status(500).json({ message: "Error updating post" });
  }
});

app.get("/delete/:id", async (req, res) => {
  try {
    await axios.delete(`${API_URL}/posts/${req.params.id}`);
    res.redirect("/home");
  } catch (err) {
    res.status(500).json({ message: "Error deleting post" });
  }
});

// ================= SERVER START =================
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
