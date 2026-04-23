import express from "express";
import homepageRoutes from "./routes/homepage.routes.js";

const app = express();

app.use(express.json());

// rutas
app.use("/homepage", homepageRoutes);

export default app;