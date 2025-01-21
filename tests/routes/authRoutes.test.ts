import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import app, { server } from '../../src/index'

afterEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  server.close()
})

jest.mock('../../src/prisma/client', () => ({
  user: {
    create: jest.fn().mockResolvedValue({ id: 'mockUserId', name: 'testUser' }),
    findFirst: jest.fn().mockResolvedValue({
      id: 'mockUserId',
      name: 'testUser',
      password: 'mockHashedPassword',
    }),
  },
  refreshToken: {
    create: jest
      .fn()
      .mockResolvedValue({ token: 'mockRefreshToken', userId: 'mockUserId' }),
    findFirst: jest.fn().mockResolvedValue({
      token: 'mockRefreshToken',
      userId: 'mockUserId',
      expiresAt: new Date(Date.now() + 1000000),
    }),
    deleteMany: jest.fn(),
  },
}))

describe('POST /register', () => {
  it('should create a user and return a success message', async () => {
    const response = await request(app)
      .post('/register')
      .send({ name: 'testUser', password: 'testPassword' })

    expect(response.status).toBe(201)
    expect(response.body.message).toBe('User created successfully')
    expect(response.body.userId).toEqual('mockUserId')
  })
})

describe('POST /login', () => {
  it('should log in the user and return an access token', async () => {
    jest.spyOn(jwt, 'sign').mockImplementationOnce(() => 'mockAccessToken')
    jest
      .spyOn(bcrypt, 'compare')
      .mockImplementationOnce(() => 'mockAccessToken')

    const response = await request(app)
      .post('/login')
      .send({ name: 'testUser', password: 'testPassword' })

    expect(response.status).toBe(200)
    expect(response.body.accessToken).toBe('mockAccessToken')
    expect(response.body.user.name).toBe('testUser')
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
      .send({ name: 'testUser', password: 'wrongPassword' })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Invalid credentials')
  })
})

describe('POST /refresh-token', () => {
  it('should return a new access token if the refresh token is valid', async () => {
    const response = await request(app)
      .post('/refresh-token')
      .set('Cookie', 'refreshToken=mockRefreshToken')

    expect(response.status).toBe(200)
    expect(response.body.user).toEqual({ id: 'mockUserId', name: 'testUser' })
    expect(response.body.accessToken).toBeDefined()
  })

  it('should return an error if the refresh token is missing or invalid', async () => {
    const response = await request(app).post('/refresh-token')

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Refresh token required')
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
