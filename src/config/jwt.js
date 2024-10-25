import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate a JWT token for a user
 * @param {Object} payload - Data to be encoded in the token
 * @returns {string} JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    throw new Error('Invalid token');
  }
};

/**
 * Generate a refresh token
 * @param {Object} payload - Data to be encoded in the token
 * @returns {string} Refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d' // Refresh token valid for 7 days
  });
};

/**
 * Extract token from authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null if invalid
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
};

/**
 * Create session token with user data
 * @param {Object} user - User object
 * @returns {Object} Tokens object containing access and refresh tokens
 */
export const createSessionTokens = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    isVerified: user.is_verified
  };

  return {
    accessToken: generateToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
};

/**
 * Configuration object for JWT options
 */
export const jwtConfig = {
  secret: JWT_SECRET,
  expiresIn: JWT_EXPIRES_IN,
  refreshExpiresIn: '7d',
  algorithm: 'HS256',
  issuer: 'contact-management-api',
  audience: 'contact-management-client'
};

/**
 * Middleware to handle token refresh
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const refreshTokenMiddleware = async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = verifyToken(refreshToken);
    
    // Generate new tokens
    const tokens = createSessionTokens({ 
      id: decoded.userId,
      email: decoded.email,
      is_verified: decoded.isVerified
    });

    // Send new tokens
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

/**
 * Create a token blacklist handler
 */
const tokenBlacklist = new Set();

export const blacklistToken = (token) => {
  tokenBlacklist.add(token);
};

export const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

// Clean up expired tokens from blacklist periodically
setInterval(() => {
  tokenBlacklist.forEach(token => {
    try {
      verifyToken(token);
    } catch {
      tokenBlacklist.delete(token);
    }
  });
}, 3600000); // Clean up every hour

export default {
  generateToken,
  verifyToken,
  generateRefreshToken,
  extractTokenFromHeader,
  decodeToken,
  createSessionTokens,
  refreshTokenMiddleware,
  blacklistToken,
  isTokenBlacklisted,
  jwtConfig
};