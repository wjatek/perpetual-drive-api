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

describe('User Routes', () => {
  describe('GET /users', () => {
    it('should return a list of users without passwords', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchJSON([
        {
          id: '{{uuid}}',
          name: 'Alice',
        },
        {
          id: '{{uuid}}',
          name: 'Bob',
        },
        {
          id: '{{uuid}}',
          name: 'Charlie',
        },
      ])
    })

    it('should return an error if access token is missing or invalid', async () => {
      const response = await request(app).get('/users')

      expect(response.status).toBe(401)
      expect(response.body.message).toBe('Authentication required')

      const response2 = await request(app)
        .get('/users')
        .set('Authorization', 'Bearer invalidToken')

      expect(response2.status).toBe(401)
      expect(response2.body.message).toBe('Invalid or expired token')
    })
  })

  describe('GET /users/:id', () => {
    it('should return a user without a password', async () => {
      const userFromDb = await prisma.user.findFirst({
        where: { name: 'Alice' },
      })
      expect(userFromDb).toBeDefined()

      const id = userFromDb?.id
      expect(id).toBeDefined()

      const response = await request(app)
        .get(`/users/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toMatchJSON({ id, name: 'Alice' })
    })

    it('should return a 404 error if the user is not found', async () => {
      const randomId = uuid()

      const response = await request(app)
        .get(`/users/${randomId}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('User not found')
    })
  })
})
