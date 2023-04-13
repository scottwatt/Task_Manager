// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");


const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/Users");
const Task = require("./models/Tasks");

require("dotenv").config();



// server.js
const JWT_SECRET = process.env.JWT_SECRET;

// Create an Express app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.REACT_APP_URL || 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Signup route
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  // Check if the email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "Email already exists." });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // console.log("Original password:", password);
  // console.log("Hashed password:", hashedPassword);

  // Create a new user
  const user = new User({ username, email, password: hashedPassword });
  // console.log("User before saving:", user);

  user.skipHash = true;

  await user.save();

  // console.log("Saved user:", user);
  // console.log("Saved user password:", user.password);

  // Generate a JWT
  const token = jwt.sign({ userId: user._id }, JWT_SECRET);

  res.cookie('token', token, {
    httpOnly: true,
    secure: true, // Set to true if using HTTPS
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 1000,
  });

  res.json({ token, userId: user._id, username });
});


// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Find the user by email
  const user = await User.findOne({ email });
  // console.log("Found user:", user);
  // console.log("Found user password:", user.password);
  if (!user) {
    return res.status(400).json({ message: "User not found." });
  }
  
  
  // Compare the provided password with the stored hashed password
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    // console.log("Invalid password"); // Add logging here
    // console.log("Entered password:", password);
    // console.log("Stored hashed password:", user.password);
    // console.log("Password comparison result:", validPassword);
    return res.status(400).json({ message: "Invalid password." });
  }
  

  // Generate a JWT
  const token = jwt.sign({ userId: user._id }, JWT_SECRET);

  res.cookie('token', token, {
    httpOnly: true,
    secure: true, // Set to true if using HTTPS
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 1000,
  });

  res.json({ token, userId: user._id, username: user.username });
  
});



// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});


// API routes
app.get("/tasks/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Extract the token from the 'Authorization' header
    const token = req.headers.authorization.split(" ")[1];

    // Verify the token and extract the user ID
    const decodedToken = jwt.verify(token, JWT_SECRET);

    if (userId !== decodedToken.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Fetch tasks for the authenticated user
    const tasks = await Task.find({ userId: userId });
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Error fetching tasks" });
  }
});


app.post("/tasks", async (req, res) => {
  const task = new Task(req.body);
  await task.save();
  res.json(task);
});

app.delete("/tasks/:taskId", async (req, res) => {
  const { taskId } = req.params;
  console.log("Server received taskId:", taskId);


  try {
    // Verify the token and extract the user ID
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, JWT_SECRET);
    const userId = decodedToken.userId;

    // Delete the task by ID and userId
    const result = await Task.deleteOne({ _id: taskId, userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting task" });
  }
});

app.put("/tasks/:taskId", async (req, res) => {
  const { taskId } = req.params;
  const updatedTaskData = req.body;

  try {
    // Verify the token and extract the user ID
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, JWT_SECRET);
    const userId = decodedToken.userId;

    // Find the task by ID and userId and update it
    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, userId },
      updatedTaskData,
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Error updating task" });
  }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
  });
}



// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
