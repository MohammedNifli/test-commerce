import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-replace-in-production';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // In a real app, you should hash passwords with bcrypt
    // For this demonstration, we'll check plain text or create an admin if none exists
    let admin = await prisma.adminUser.findUnique({ where: { username } });

    if (!admin) {
      // Auto-create first admin if DB is empty for ease of testing
      const adminCount = await prisma.adminUser.count();
      if (adminCount === 0) {
        admin = await prisma.adminUser.create({
          data: { username, password } // Store plain password for demo purposes only
        });
      } else {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      if (admin.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '1d' });
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: admin.id, username: admin.username }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
