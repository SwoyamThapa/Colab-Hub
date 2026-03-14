import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res
        .status(500)
        .json({ message: 'JWT_SECRET is not configured on the server' });
    }

    const decoded = jwt.verify(token, secret);

    // We sign tokens with { userId, email }
    req.user = {
      id: decoded.userId,
      email: decoded.email,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

