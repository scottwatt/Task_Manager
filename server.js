// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/Users");
const Task = require("./models/Tasks");


// server.js
const JWT_SECRET = "your_jwt_secret";

// Create an Express app
const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
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

  // Create a new user
  const user = new User({ username, email, password: hashedPassword });
  await user.save();

  // Generate a JWT
  const token = jwt.sign({ userId: user._id }, JWT_SECRET);

  res.json({ token, userId: user._id, username });
});

// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Find the user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password." });
  }

  // Compare the provided password with the stored hashed password
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ message: "Invalid email or password." });
  }

  // Generate a JWT
  const token = jwt.sign({ userId: user._id }, JWT_SECRET);

  res.json({ token, userId: user._id, username: user.username });
});



// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/task-manager", {
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



// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
