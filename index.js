import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app2 = express();
const port = 1000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "journal",
  password: "databasekapassword",
  port: 5432,
});
db.connect();

//Middleware
app2.use(express.json());
app2.use(bodyParser.urlencoded({ extended: true }));
app2.use(express.static("public"));

//GET all posts
app2.get("/posts", async (req, res) => {
  try {
    const posts = await db.query("SELECT * FROM journal ORDER BY id ASC");
    res.json(posts.rows);
    // console.log(posts.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//GET a specific post by id
app2.get("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const posts = await db.query("SELECT * FROM journal WHERE id = $1", [id]);
    if (posts.rows.length === 0) {
      return res.status(404).json({ message: "post not found" });
    }
    res.json(posts.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Post a new post
app2.post("/posts", async (req, res) => {
  try {
    const { title, content, author } = req.body;

    const currentDate = new Date().toLocaleDateString("en-us", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });

    const result = await db.query(
      "INSERT INTO journal (title, content, author, date) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, content, author, currentDate]
    );
    res.json(result.rows[0]);
  } catch (error) {
    // console.log("Error creating post:", error.message);
    res.status(500).json({ message: error.message });
  }
});

//Patch a post
app2.patch("/posts/:id", async (req, res) => {
  try {
    const currentDate = new Date().toLocaleDateString("en-us", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });

    const { title, content, author } = req.body;
    const { id } = req.params;

    const result = await db.query(
      "UPDATE journal SET title = COALESCE($1, title), content = COALESCE($2, content), author = COALESCE($3, author), date = $4 WHERE id = $5 RETURNING *",
      [title, content, author, currentDate, id]
    );
    // console.log("Params:", req.params);
    // console.log("body:", req.body);
    res.json(result.rows[0]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Delete a post
app2.delete("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM journal WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json({ message: "Post deleted" });
    // res.redirect("/");
  } catch (error) {
    // console.log("Error in DELETE /posts/:id", error.message);
    res.status(500).json({ error: error.message });
  }
});

app2.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
});

app2.listen(port, () => {
  console.log(`APi is running at http://localhost:${port}`);
});
