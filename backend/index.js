const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const serverless = require("serverless-http");

console.log("### STARTING NEW MONGO VERSION BACKEND ###");


const app = express();
const port = 4000;

app.use(express.json());
app.use(cors());

let client;
let postsCollection;

// connect once and reuse the connection
async function connectToDatabase() {
  if (!client) {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI environment variable is not set");
    }

    client = new MongoClient(uri);
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");

    const db = client.db("miniClassroom");      // database name
    postsCollection = db.collection("posts");   // collection name
  }
}

// health check route (used to confirm which code is running)
app.get("/", async (req, res) => {
  res.send("HELLO FROM MONGO VERSION");
});

// get all posts
app.get("/posts", async (req, res) => {
  try {
    await connectToDatabase();
    const posts = await postsCollection.find({}).toArray();
    res.json(posts);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

// create a new post
app.post("/posts", async (req, res) => {
  try {
    await connectToDatabase();
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: "Title and body are required" });
    }

    const newPost = {
      title,
      body,
      createdAt: new Date()
    };

    const result = await postsCollection.insertOne(newPost);
    newPost._id = result.insertedId;

    res.status(201).json(newPost);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ message: "Failed to create post" });
  }
});

// start server
app.listen(port, () => {
  console.log(`🚀 Backend running on http://localhost:${port}`);
});


module.exports.handler = serverless(app);
