/**
 * Initial data for development and testing
 * 
 * use:
 * npx ts-node prisma/seed.ts
 */

import prisma from "../src/prisma/client";

async function seed() {
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});
  
  await prisma.$executeRaw`ALTER SEQUENCE "User_id_seq" RESTART WITH 1;`;
  await prisma.$executeRaw`ALTER SEQUENCE "Post_id_seq" RESTART WITH 1;`;

  await prisma.user.createMany({
    data: [
      { name: "Alice" },
      { name: "Bob" },
      { name: "Charlie" },
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