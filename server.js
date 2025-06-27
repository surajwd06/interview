const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const app = express();
dotenv.config();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, 'build')));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📁 Created 'uploads' folder.");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (["image/jpeg", "image/png"].includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG/PNG allowed"));
  }
});

const User = mongoose.model("User", new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, required: true }, // ✅ DO NOT add 'unique: true'
  password: String,
  profession: String,
  company: String,
  addressLine1: String,
  country: String,
  state: String,
  city: String,
  plan: String,
  newsletter: Boolean,
  profileImage: String
}));


app.get("/api/check-username/:username", async (req, res) => {
  const exists = await User.findOne({ username: req.params.username });
  res.json({ available: !exists });
});

app.get("/api/countries", (req, res) => {
  res.json(["India", "USA"]);
});

app.get("/api/states/:country", (req, res) => {
  const map = {
    India: ["Maharashtra", "Delhi"],
    USA: ["California", "Texas"]
  };
  res.json(map[req.params.country] || []);
});

app.get("/api/cities/:state", (req, res) => {
  const map = {
    Maharashtra: ["Mumbai", "Pune"],
    Delhi: ["New Delhi"],
    California: ["Los Angeles", "San Francisco"],
    Texas: ["Houston"]
  };
  res.json(map[req.params.state] || []);
});

app.post("/api/submit", upload.single("profileImage"), async (req, res) => {
  try {
    if (!req.file) throw new Error("No profile image uploaded");
    const data = JSON.parse(req.body.data);
    data.profileImage = req.file.filename;
    await User.create(data);
    res.json({ success: true });
  } catch (e) {
    console.error("Submit Error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

