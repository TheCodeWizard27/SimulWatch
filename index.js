let express = require("express");
let app = express();
var http = require("http").createServer(app);
let io = require("socket.io")(http);

let Server = require("./src/server");
let server = new Server(io);

app.use(express.static("public/"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/views/index.html");
});

app.get("/angular/angular.js", (req, res) => {
    res.sendFile(__dirname + "/node_modules/angular/angular.min.js");
});

http.listen(3000, () => {
    console.log("listening on *:3000");
});