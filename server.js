import express from "express";
import dotenv from "dotenv";
import incidentsRouter from "./routes/incidents.js";

dotenv.config();

const app = express();

app.use(express.json({limit:"1mb"}));

app.use("/v2/incidents", incidentsRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running on ${port}`);
});
