/**
 * Initial data for development and testing
 *
 * use:
 * npx ts-node prisma/seed.ts
 */

import prisma from '../src/prisma/client'
import bcrypt from 'bcryptjs'

async function seed() {
  await prisma.file.deleteMany();
  await prisma.directory.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  console.log('Database cleared')

  const alice = await prisma.user.create({
    data: { name: "Alice", password: await bcrypt.hash('123456', 10) },
  });
  const bob = await prisma.user.create({
    data: { name: "Bob", password: await bcrypt.hash('123456', 10) },
  });
  const charlie = await prisma.user.create({
    data: { name: "Charlie", password: await bcrypt.hash('654321', 10) },
  });

  const users = await prisma.user.findMany()
  await prisma.post.createMany({
    data: [
      { content: "Alice's first post", authorId: users[0].id },
      { content: "Bob's first post", authorId: users[1].id },
      { content: "Charlie's first post", authorId: users[2].id },
    ],
  })

  const aliceRootDir = await prisma.directory.create({
    data: { name: "Alice's Root Directory", authorId: alice.id },
  });

  const aliceSubDir = await prisma.directory.create({
    data: {
      name: "Alice's Subdirectory",
      authorId: alice.id,
      parentId: aliceRootDir.id,
    },
  });

  const bobRootDir = await prisma.directory.create({
    data: { name: "Bob's Root Directory", authorId: bob.id },
  });

  await prisma.file.create({
    data: {
      name: "alice music.mp3",
      authorId: alice.id,
      directoryId: aliceRootDir.id,
    },
  });

  await prisma.file.create({
    data: {
      name: "alice resume.pdf",
      authorId: alice.id,
      directoryId: aliceSubDir.id,
    },
  });

  await prisma.file.create({
    data: {
      name: "Bob's File 1",
      authorId: bob.id,
      directoryId: bobRootDir.id,
    },
  });
}

seed()
  .then(() => {
    console.log('Seeding completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error seeding database:', error)
    process.exit(1)
  })
