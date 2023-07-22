require("dotenv").config();

const env = require("./config/env");

const express = require("express");

const app = express();

app.post("/interactions", (req, res) => {
  res.send("interactions ok");
});

app.get("/register_commands", (req, res) => {
  res.send("register_commands ok");
});

app.get("/", async (req, res) => {
  res.send("ok");
});

app.listen(env.port, () => {
  console.log(`Server is listening on port ${env.port}`);
});
