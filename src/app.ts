import { Hono } from "hono";
import fsRoutes from "./routes/fs";

const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));
app.route("/fs", fsRoutes);

export default app;
