import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res
        .status(500)
        .json({ message: 'JWT_SECRET is not configured on the server' });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;

  // Basic Validation
  if (!name || !normalizedEmail || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    //Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
    });

    //Generate JWT so they are logged in immediately
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res
        .status(500)
        .json({ message: 'JWT_SECRET is not configured on the server' });
    }
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      secret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};