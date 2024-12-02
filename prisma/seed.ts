/**
 * Initial data for development and testing
 *
 * use:
 * npx ts-node prisma/seed.ts
 */

import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import prisma from '../src/prisma/client'
import { FILE_STORAGE_PATH } from '../src/services/fileService'

const generateFile = async (
  dir: string,
  fileName: string,
  sizeInMB: number
): Promise<void> => {
  const filePath = path.join(dir, fileName)

  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir, { recursive: true })
  }

  const writeStream = fs.createWriteStream(filePath)

  const oneMB = 1024 * 1024
  const sizeInBytes = sizeInMB * oneMB

  const randomData = Buffer.alloc(oneMB)

  let written = 0
  while (written < sizeInBytes) {
    if (written + oneMB > sizeInBytes) {
      writeStream.write(randomData.slice(0, sizeInBytes - written))
    } else {
      writeStream.write(randomData)
    }
    written += oneMB
  }

  writeStream.end()

  return new Promise<void>((resolve, reject) => {
    writeStream.on('finish', () => {
      console.log(
        `File '${fileName}' of size ${sizeInMB}MB has been created at ${dir}`
      )
      resolve()
    })

    writeStream.on('error', (err) => {
      console.error(`Error writing file: ${err.message}`)
      reject(err)
    })
  })
}

const clearDirectory = async (dir: string): Promise<void> => {
  if (fs.existsSync(dir)) {
    const files = await fs.promises.readdir(dir)
    for (const file of files) {
      const filePath = path.join(dir, file)
      const stats = await fs.promises.stat(filePath)
      if (stats.isFile()) {
        await fs.promises.unlink(filePath)
      }
    }
    console.log(`All files removed from ${dir}`)
  }
}

async function seed() {
  await prisma.file.deleteMany()
  await prisma.directory.deleteMany()
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()

  console.log('Database cleared')

  const alice = await prisma.user.create({
    data: { name: 'Alice', password: await bcrypt.hash('123456', 10) },
  })
  const bob = await prisma.user.create({
    data: { name: 'Bob', password: await bcrypt.hash('123456', 10) },
  })
  const charlie = await prisma.user.create({
    data: { name: 'Charlie', password: await bcrypt.hash('654321', 10) },
  })

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
  })

  const aliceSubDir = await prisma.directory.create({
    data: {
      name: "Alice's Subdirectory",
      authorId: alice.id,
      parentId: aliceRootDir.id,
    },
  })

  const bobRootDir = await prisma.directory.create({
    data: { name: "Bob's Root Directory", authorId: bob.id },
  })

  clearDirectory(FILE_STORAGE_PATH)

  const file1 = await prisma.file.create({
    data: {
      name: 'alice music.mp3',
      authorId: alice.id,
      directoryId: aliceRootDir.id,
    },
  })
  await generateFile(FILE_STORAGE_PATH, file1.id, 12)

  const file2 = await prisma.file.create({
    data: {
      name: 'alice resume.pdf',
      authorId: alice.id,
      directoryId: aliceSubDir.id,
    },
  })
  await generateFile(FILE_STORAGE_PATH, file2.id, 15)

  const file3 = await prisma.file.create({
    data: {
      name: "Bob's File 1",
      authorId: bob.id,
      directoryId: bobRootDir.id,
    },
  })
  await generateFile(FILE_STORAGE_PATH, file3.id, 10)

  const file4 = await prisma.file.create({
    data: {
      name: 'file in root directory.txt',
      authorId: bob.id,
    },
  })
  await generateFile(FILE_STORAGE_PATH, file4.id, 102)
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
