
import { User } from '../models/User.js';
import { 
  createSessionTokens, 
  blacklistToken, 
  extractTokenFromHeader 
} from '../config/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

// ... other imports ...

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_verified) {
      return res.status(401).json({ error: 'Please verify your email first' });
    }

    const tokens = createSessionTokens(user);

    res.json({
      message: 'Login successful',
      ...tokens
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

export const logout = async (req, res) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (token) {
      blacklistToken(token);
    }
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Add to auth routes
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const tokens = await refreshTokenMiddleware(req, res);
    res.json(tokens);
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

