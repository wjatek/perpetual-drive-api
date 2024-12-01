import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import userRoutes from "./routes/userRoutes";
import postRoutes from "./routes/postRoutes";

dotenv.config();

const PORT = process.env.PORT || '3000';

const app = express();
app.use(cors());

app.use("/users", userRoutes);
app.use("/posts", postRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});