const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = 5000;
const siteFolder = path.join(__dirname, "..");

// Admin login details
const ADMIN_USER = "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.log("ADMIN_PASSWORD is missing. Create backend/.env and start with:");
  console.log("node --env-file=.env server.js");
  process.exit(1);
}

app.use(express.json());

// Compare two texts safely
function safeEqual(a, b) {
  const hashA = crypto.createHash("sha256").update(String(a)).digest();
  const hashB = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// Ask for the admin login before continuing
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const parts = header.split(" ");

  if (parts[0] === "Basic" && parts[1]) {
    const decoded = Buffer.from(parts[1], "base64").toString();
    const split = decoded.indexOf(":");

    if (split !== -1) {
      const user = decoded.slice(0, split);
      const pass = decoded.slice(split + 1);

      if (safeEqual(user, ADMIN_USER) && safeEqual(pass, ADMIN_PASSWORD)) {
        return next();
      }
    }
  }

  res.set("WWW-Authenticate", 'Basic realm="My Learning Space Admin"');
  res.status(401).send("Login required");
}

// Open (or create) the database file and make the table
const db = new Database(path.join(__dirname, "registrations.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    course TEXT NOT NULL,
    about TEXT DEFAULT '',
    date TEXT NOT NULL
  )
`);

const COURSES = [
  "Web Development",
  "Python Programming",
  "Cybersecurity",
  "Data Analytics"
];

// Public website files
["index.html", "style.css", "script.js"].forEach(function (file) {
  app.get("/" + file, function (req, res) {
    res.sendFile(path.join(siteFolder, file));
  });
});
app.get("/", function (req, res) {
  res.sendFile(path.join(siteFolder, "index.html"));
});

// Admin page: login required
app.get("/admin.html", requireAdmin, function (req, res) {
  res.sendFile(path.join(siteFolder, "admin.html"));
});

// Public list for the main page: names and courses only
app.get("/api/students", function (req, res) {
  const rows = db
    .prepare("SELECT id, name, course FROM registrations ORDER BY id")
    .all();
  res.json(rows);
});

// Full list for the admin page: login required
app.get("/api/registrations", requireAdmin, function (req, res) {
  const rows = db.prepare("SELECT * FROM registrations ORDER BY id").all();
  res.json(rows);
});

// Save a new registration (anyone can register)
app.post("/api/registrations", function (req, res) {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim();
  const course = String(req.body.course || "").trim();
  const about = String(req.body.about || "").trim();

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!name || !emailLooksValid || !COURSES.includes(course)) {
    return res
      .status(400)
      .json({ error: "Please fill in all required fields correctly." });
  }
  if (name.length > 100 || email.length > 150 || about.length > 1000) {
    return res.status(400).json({ error: "One of the fields is too long." });
  }

  const info = db
    .prepare(
      "INSERT INTO registrations (name, email, course, about, date) VALUES (?, ?, ?, ?, ?)"
    )
    .run(name, email, course, about, new Date().toISOString());

  res.status(201).json({ id: info.lastInsertRowid });
});

// Delete one registration: login required
app.delete("/api/registrations/:id", requireAdmin, function (req, res) {
  db.prepare("DELETE FROM registrations WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Delete all registrations: login required
app.delete("/api/registrations", requireAdmin, function (req, res) {
  db.prepare("DELETE FROM registrations").run();
  res.json({ ok: true });
});

app.listen(PORT, function () {
  console.log("Server running at http://localhost:" + PORT);
});