const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const colors = require("colors");
const morgan = require("morgan");
const firebaseConnect = require("./firebase/firebaseConnect");
const busboy = require("connect-busboy");

dotenv.config({ path: "./config/config.env" });

const posts = require("./controllers/posts");
const user = require("./controllers/user");

firebaseConnect();

const app = express();

app.use(express.json());
app.use(busboy());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/posts", posts);
app.use("/api/user", user);

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"))
  );
}

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);
