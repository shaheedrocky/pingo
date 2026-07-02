import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const generateAccessToken = (userId) => {
    return jwt.sign({id: userId}, process.env.JWT_ACCESS_SECRET, {expiresIn: '15m'})
}

export const generateRefreshToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "30d",
    }
  );
};

export const verifyPassword = (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword)
}

export const hashPassword = (password) => {
    return bcrypt.hash(password, 10)
}