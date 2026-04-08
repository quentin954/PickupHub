import { prisma } from '../config/database';
import { ConflictError, UnauthorizedError, NotFoundError } from '../errors/errors';
import { hashPassword, comparePassword } from '../utils/crypto';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { log } from '../utils/logger';
import { RegisterInput, LoginInput } from '../dto/auth.dto';

export class AuthService {
  static async register(data: RegisterInput) {
    const { email, password } = data;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError('Email already in use.');
    }

    const hashedPassword = await hashPassword(password);
    
    await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
      },
    });

    log('info', 'New user registered', { email });
    return { message: 'User created successfully.' };
  }

  static async login(data: LoginInput) {
    const { email, password } = data;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      log('warn', 'Failed login attempt', { email });
      throw new UnauthorizedError('Invalid credentials.');
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  static async refresh(token: string) {
    try {
      const decoded = verifyRefreshToken(token);
      
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedError('Invalid or expired refresh token.');
      }

      const userId = decoded['id'] as string;
      const accessToken = generateAccessToken(userId);
      const newRefreshToken = generateRefreshToken(userId);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.$transaction([
        prisma.refreshToken.delete({
          where: { token },
        }),
        prisma.refreshToken.create({
          data: {
            userId,
            token: newRefreshToken,
            expiresAt,
          },
        }),
      ]);

      return { accessToken, refreshToken: newRefreshToken };
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError('Invalid refresh token.');
    }
  }

  static async logout(token: string) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken) {
      throw new NotFoundError('Refresh token');
    }

    await prisma.refreshToken.delete({
      where: { token },
    });

    return { message: 'Logged out successfully.' };
  }
}
