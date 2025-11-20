import express from "express";
import bodyParser from "body-parser";

import ServerConfig from "./config/serverConfig.js";
import apiRouter from "./routes/index.js";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());

app.use('/api', apiRouter);

app.listen(ServerConfig.PORT, () => {
    console.log(`Server started at *:${ServerConfig.PORT}`)
});