import prisma from '../../prisma/client'
import request from 'supertest'
import app, { server } from '../../index'

afterAll(() => {
  server.close()
})

describe('POST /register', () => {
  it('should create a user and return a success message', async () => {
    const response = await request(app)
      .post('/register')
      .send({ name: 'testUser', password: 'testPassword' })
    await prisma.user.deleteMany({ where: { name: 'testUser' } })

    expect(response.status).toBe(201)
    expect(response.body.message).toBe('User created successfully')
    expect(response.body.userId).toBeDefined()
  })
})

describe('POST /login', () => {
  it('should log in the user and return an access token', async () => {
    const response = await request(app)
      .post('/login')
      .send({ name: 'Alice', password: '123456' })

    expect(response.status).toBe(200)
    expect(response.body.accessToken).toBeDefined()
    expect(response.body.user.name).toBe('Alice')
  })

  it('should return an error if credentials are missing', async () => {
    const response = await request(app)
      .post('/login')
      .send({ name: '', password: '' })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Missing credentials')
  })

  it('should return an error if invalid credentials are provided', async () => {
    const response = await request(app)
      .post('/login')
      .send({ name: 'Alice', password: '654321' })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Invalid credentials')
  })
})

describe('POST /refresh-token', () => {
  it('should return a new access token if the refresh token is valid', async () => {
    const loginResponse = await request(app)
      .post('/login')
      .send({ name: 'Alice', password: '123456' })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body.accessToken).toBeDefined()

    const cookies = loginResponse.headers['set-cookie']
    expect(cookies).toBeDefined()

    const response = await request(app)
      .post('/refresh-token')
      .set('Cookie', cookies)

    expect(response.status).toBe(200)
    expect(response.body.accessToken).toBeDefined()
  })

  it('should return an error if the refresh token is missing or invalid', async () => {
    const response = await request(app).post('/refresh-token')

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Refresh token required')

    const response2 = await request(app)
      .post('/refresh-token')
      .set('Cookie', 'refreshToken=invalidToken')

    expect(response2.status).toBe(401)
    expect(response2.body.message).toBe('Invalid or expired refresh token')
  })
})

describe('POST /logout', () => {
  it('should log out the user and clear the refresh token', async () => {
    const response = await request(app)
      .post('/logout')
      .set('Cookie', 'refreshToken=mockRefreshToken')

    expect(response.status).toBe(200)
    expect(response.body.message).toBe('Logged out successfully')
  })
})
