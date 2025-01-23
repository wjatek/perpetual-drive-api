import request from 'supertest'
import { v4 as uuid } from 'uuid'
import app, { server } from '../../index'
import prisma from '../../prisma/client'

let accessToken: string

beforeAll(async () => {
  const loginResponse = await request(app)
    .post('/login')
    .send({ name: 'Alice', password: '123456' })

  expect(loginResponse.status).toBe(200)
  accessToken = loginResponse.body.accessToken
  expect(accessToken).toBeDefined()
})

afterAll(() => {
  server.close()
})

describe('Directory Routes', () => {
  describe('GET /directories', () => {
    it('should return a list of directories', async () => {
      const response = await request(app)
        .get('/directories')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchJSON([
        {
          id: '{{uuid}}',
          name: "Alice's Root Directory",
          authorId: '{{uuid}}',
          createdAt: '{{date}}',
          parentId: null,
        },
        {
          id: '{{uuid}}',
          name: "Alice's Subdirectory",
          authorId: '{{uuid}}',
          createdAt: '{{date}}',
          parentId: '{{uuid}}',
        },
        {
          id: '{{uuid}}',
          name: "Bob's Root Directory",
          authorId: '{{uuid}}',
          createdAt: '{{date}}',
          parentId: null,
        },
      ])
    })

    it('should return an error if access token is missing or invalid', async () => {
      const response = await request(app).get('/directories')

      expect(response.status).toBe(401)
      expect(response.body.message).toBe('Authentication required')

      const response2 = await request(app)
        .get('/directories')
        .set('Authorization', 'Bearer invalidToken')

      expect(response2.status).toBe(401)
      expect(response2.body.message).toBe('Invalid or expired token')
    })
  })

  describe('GET /directories/:id', () => {
    it('should return a directory', async () => {
      const directoryFromDb = await prisma.directory.findFirst({
        where: { name: "Alice's Root Directory" },
      })
      expect(directoryFromDb).toBeDefined()

      const id = directoryFromDb?.id
      expect(id).toBeDefined()

      const response = await request(app)
        .get(`/directories/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchJSON({
        id: id,
        name: "Alice's Root Directory",
        authorId: '{{uuid}}',
        createdAt: '{{date}}',
        parentId: null,
      })
    })

    it('should return a 404 error if the directory is not found', async () => {
      const randomId = uuid()

      const response = await request(app)
        .get(`/directories/${randomId}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Directory not found')
    })
  })
})
