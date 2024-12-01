/**
 * Initial data for development and testing
 * 
 * use:
 * npx ts-node prisma/seed.ts
 */

import prisma from "../src/prisma/client";
import bcrypt from "bcryptjs";


async function seed() {
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});

  await prisma.$executeRaw`ALTER SEQUENCE "User_id_seq" RESTART WITH 1;`;
  await prisma.$executeRaw`ALTER SEQUENCE "Post_id_seq" RESTART WITH 1;`;

  await prisma.user.createMany({
    data: [
      { name: "Alice", password: await bcrypt.hash("123456", 10) },
      { name: "Bob", password: await bcrypt.hash("123456", 10)  },
      { name: "Charlie", password: await bcrypt.hash("654321", 10)  },
    ],
  });

  const users = await prisma.user.findMany();
  await prisma.post.createMany({
    data: [
      { content: "Alice's first post", authorId: users[0].id },
      { content: "Bob's first post", authorId: users[1].id },
      { content: "Charlie's first post", authorId: users[2].id },
    ],
  });
}

seed()
  .then(() => {
    console.log("Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  });