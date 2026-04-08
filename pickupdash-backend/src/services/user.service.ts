import { prisma } from '../config/database';
import { NotFoundError } from '../errors/errors';

export class UserService {
  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        platformAccount: true,
        emailAccount: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return {
      email: user.email,
      platform: {
        linked: Boolean(user.platformAccount),
      },
      emailAccount: user.emailAccount ? {
        linked: true,
        provider: user.emailAccount.provider,
        email: user.emailAccount.emailAddress,
      } : {
        linked: false,
      },
    };
  }
}
