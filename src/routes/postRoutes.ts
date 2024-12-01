import express, { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";

const router = express.Router();


router.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posts = await prisma.post.findMany();
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({ where: { id: Number(id) } });

    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    res.json(post);
  } catch (err) {
    next(err);
  }
});

export default router;