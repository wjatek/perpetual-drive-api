/**
 * Initial data for development and testing
 * 
 * use:
 * npx ts-node prisma/seed.ts
 */

import prisma from "../src/prisma/client";

async function seed() {
  await prisma.user.createMany({
    data: [
      { name: "Alice" },
      { name: "Bob" },
      { name: "Charlie" },
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