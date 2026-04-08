import { prisma } from '../config/database';
import { PackageQueryInput, UpdatePackageInput } from '../dto/packages.dto';
import { BadRequestError, NotFoundError, ForbiddenError } from '../errors/errors';
import { log } from '../utils/logger';

export class PackageService {
  static async getPackages(userId: string, query: PackageQueryInput) {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status && { status }),
    };

    const [packages, total] = await Promise.all([
      prisma.package.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              conversationId: true,
              transactionId: true,
              title: true,
              priceAmount: true,
              priceCurrency: true,
              itemPhotoUrl: true,
            },
          },
        },
      }),
      prisma.package.count({ where }),
    ]);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastSyncedAt: true },
    });

    const data = packages.map(pkg => ({
      id: pkg.id,
      orderId: pkg.orderId,
      trackingCode: pkg.trackingCode,
      carrierCode: pkg.carrierCode,
      trackingUrl: pkg.trackingUrl,
      carrierLogoUrl: pkg.carrierLogoUrl,
      lockerName: pkg.lockerName,
      lockerAddress: pkg.lockerAddress,
      lockerPostalCode: pkg.lockerPostalCode,
      lockerCity: pkg.lockerCity,
      retrievalCode: pkg.retrievalCode,
      qrCodeData: pkg.qrCodeData,
      status: pkg.status,
      expiryDate: pkg.expiryDate,
      order: pkg.order ? {
        id: pkg.order.id,
        conversationId: pkg.order.conversationId.toString(),
        transactionId: pkg.order.transactionId.toString(),
        title: pkg.order.title,
        priceAmount: Number(pkg.order.priceAmount),
        priceCurrency: pkg.order.priceCurrency,
        itemPhotoUrl: pkg.order.itemPhotoUrl,
      } : null,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        lastSync: user?.lastSyncedAt?.toISOString() || null,
      },
    };
  }

  static async synchronize(userId: string) {
    const platformAccount = await prisma.platformAccount.findUnique({
      where: { userId },
    });

    if (!platformAccount) {
      throw new BadRequestError('Platform account not linked.');
    }

    log('info', 'Starting package synchronization', { userId });

    // TODO: Implement API call to external platform to fetch packages

    await prisma.user.update({
      where: { id: userId },
      data: { lastSyncedAt: new Date() },
    });

    log('info', 'Package synchronization completed', { userId });

    return {
      message: 'Sync completed successfully.',
      lastSync: new Date().toISOString(),
    };
  }

  static async updatePackage(userId: string, packageId: string, data: UpdatePackageInput) {
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      throw new NotFoundError('Package');
    }

    if (pkg.userId !== userId) {
      throw new ForbiddenError('Access denied.');
    }

    const allowedStatuses = ['AVAILABLE_FOR_PICKUP', 'DELIVERED', 'EXPIRED', 'IN_TRANSIT'];
    if (!allowedStatuses.includes(data.status)) {
      throw new BadRequestError('Invalid status. Allowed: AVAILABLE_FOR_PICKUP, DELIVERED, EXPIRED, IN_TRANSIT');
    }

    const updated = await prisma.package.update({
      where: { id: packageId },
      data: { status: data.status },
    });

    log('info', 'Package updated', { packageId, status: data.status });

    return { status: updated.status };
  }
}