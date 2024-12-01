import bcrypt from "bcryptjs";
import express, { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma/client";

const router = express.Router();

router.post("/register", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, password } = req.body;
  try {
    console.log('Got body:', req.body);
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: "User created successfully", userId: newUser.id });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, password } = req.body;

  if (!name || !password) {
    res.status(401).json({ error: "Missing credentials" });
    return;
  }

  try {
    const user = await prisma.user.findFirst({ where: { name } });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "default_secret", {
      expiresIn: "1h",
    });

    res.json({ message: "Login successful", token });
  } catch (err) {
    next(err);
  }
});

export default router;