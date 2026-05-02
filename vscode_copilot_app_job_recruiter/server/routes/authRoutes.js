import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { users } from '../data/users.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

const createToken = (user) => jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
  expiresIn: '1d',
})

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' })
  }

  const existingUser = users.find((user) => user.email.toLowerCase() === email.toLowerCase())
  if (existingUser) {
    return res.status(409).json({ error: 'A user with that email already exists.' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const newUser = {
    id: `user-${Date.now()}`,
    name,
    email,
    password: hashedPassword,
  }

  users.push(newUser)

  const token = createToken(newUser)
  res.status(201).json({
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    },
    token,
  })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase())
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' })
  }

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password.' })
  }

  const token = createToken(user)
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    token,
  })
})

export default router
