import bcrypt from 'bcryptjs'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import prisma from '../src/prisma/client'
import { FILE_STORAGE_PATH } from '../src/services/fileService'

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

const resetDatabase = async () => {
  execSync('npx prisma db push --force-reset', { stdio: 'inherit' })
}

const generateFile = async (
  dir: string,
  fileName: string,
  sizeInBytes: number
): Promise<void> => {
  const filePath = path.join(dir, fileName)

  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir, { recursive: true })
  }

  const writeStream = fs.createWriteStream(filePath)

  const oneMB = 1024 * 1024
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
        `File '${fileName}' of size ${
          sizeInBytes * 1024 * 1024
        }MB has been created at ${dir}`
      )
      resolve()
    })

    writeStream.on('error', (err) => {
      console.error(`Error writing file: ${err.message}`)
      reject(err)
    })
  })
}

const seedData = async () => {
  console.log('Seeding data...')
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

  const posts = await prisma.post.findMany()
  await prisma.comment.createMany({
    data: [
      {
        content: "Hi, I'm Alice, this is my first comment!",
        authorId: users[0].id,
        postId: posts[0].id,
      },
      {
        content:
          'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos inventore reiciendis sapiente!',
        authorId: users[1].id,
        postId: posts[0].id,
      },
      {
        content:
          'A Horcrux was an object in which a Dark wizard or witch had hidden a detached fragment of his or her soul in order to become immortal.',
        authorId: users[0].id,
        postId: posts[2].id,
      },
      {
        content:
          'Horcruxes could only be created after committing murder, the most supreme act of evil, as a means to tear the soul.',
        authorId: users[1].id,
        postId: posts[2].id,
      },
      {
        content:
          'Given that Horcruxes were utterly precious to those who made them, protective measures were taken to prevent them from being stolen or destroyed, such as counter-charms and curses.',
        authorId: users[2].id,
        postId: posts[2].id,
      },
      {
        content:
          'The first known Horcrux was created by Herpo the Foul in Ancient Greece. The only other known creator of a Horcrux was Lord Voldemort, who was very likely the only person to have successfully created more than one.',
        authorId: users[0].id,
        postId: posts[2].id,
      },
    ],
  })

  await prisma.post.update({
    where: { id: posts[0].id },
    data: {
      likedBy: { connect: { id: users[2].id } },
    },
  })

  await prisma.post.update({
    where: { id: posts[2].id },
    data: {
      likedBy: { connect: { id: users[0].id } },
    },
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

  await clearDirectory(FILE_STORAGE_PATH)

  const file1Size = 12 * 1024 * 1024
  const file1 = await prisma.file.create({
    data: {
      name: 'alice music.mp3',
      authorId: alice.id,
      directoryId: aliceRootDir.id,
      size: file1Size,
    },
  })
  await generateFile(FILE_STORAGE_PATH, file1.id, file1Size)

  const file2Size = 15 * 1024 * 1024
  const file2 = await prisma.file.create({
    data: {
      name: 'alice resume.pdf',
      authorId: alice.id,
      directoryId: aliceSubDir.id,
      size: file2Size,
    },
  })
  await generateFile(FILE_STORAGE_PATH, file2.id, file2Size)

  const file3Size = 10 * 1024 * 1024
  const file3 = await prisma.file.create({
    data: {
      name: "Bob's File 1",
      authorId: bob.id,
      directoryId: bobRootDir.id,
      size: file3Size,
    },
  })
  await generateFile(FILE_STORAGE_PATH, file3.id, file3Size)

  const file4Size = 102 * 1024 * 1024
  const file4 = await prisma.file.create({
    data: {
      name: 'file in root directory.txt',
      authorId: bob.id,
      size: file4Size,
    },
  })
  await generateFile(FILE_STORAGE_PATH, file4.id, file4Size)
}

async function seed() {
  try {
    await resetDatabase()
    await seedData()
    console.log('Seeding completed')
    process.exit(0)
  } catch (error) {
    console.error('Error during seeding:', error)
    process.exit(1)
  }
}

seed()
