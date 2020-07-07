const keys = require("./keys");
const auth = require("./auth");

// Express
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

// PostgreSQL
const { Pool } = require("pg");

// Redis
const redis = require("redis");
const { spawn } = require("child_process");

// Express Setup
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Redis setup
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});
const redisPublisher = redisClient.duplicate();
const pythonRedis = spawn("python", ["./redis_project/canvas.py"]);
pythonRedis.stdout.on("data", (output) => {
  console.log("Obtaining data from python script ...");
  console.log(output.toString());
});
pythonRedis.on("close", (code) => {
  console.log(`Child process closing with code ${code}`);
});

// Express route handlers

/*
Requests:

GET /  : gets the page
GET /api/grid : gets the grid
POST /api/grid : updates a pixel on the grid
POST /api/admin/clear : admin clear

*/

app.get("/:chatId/:userId", (req, res) => {
  const chatId = req.params.chatId;
  const userId = req.params.userId;
  const isPermitted = auth.authenticateChatId(chatId); // TODO: telegram authentication
  if (!isPermitted) {
    res.sendStatus(401);
  }
  // res.sendFile("/frontend/index.html", { root: ".." })
  res.redirect("https://www.reddit.com/r/HydroHomies/");
});

app.get("/api/grid", (req, res) => {
  console.log("Grid requested.");
  res.sendStatus(200);
});

app.post("/api/grid/:chatId/:userId", (req, res) => {
  const chatId = req.params.chatId;
  const userId = req.params.userId;
  const isPermitted = auth.authenticateChatId(chatId); // TODO: telegram authentication
  const user = getUser(userId); //TODO: check if user can place pixel
  if (isPermitted) {
    const color = req.body.color;
    const user = req.body.user;
    // TODO: pixel update
    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
});

app.post("/admin/clear", (req, res) => {
  try {
    const topLeft = req.body.topLeft; // array of two numbers
    const bottomRight = req.body.bottomRight; // array of two numbers
    if (bottomRight[0] < topLeft[0] || bottomRight[1] < topLeft[1]) {
      res.status(400).send("<p>Bad Request. Invalid coordinates.</p>");
      return;
    }
    // TODO: admin wipe
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(400);
  }
});

app.listen(5000, () => console.log("Listening on port 5000..."));
