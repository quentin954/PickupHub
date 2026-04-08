import { Request, Response } from 'express';
import { PackageService } from '../services/package.service';
import { AuthenticatedRequest } from '../types/request.types';
import { packageQuerySchema, updatePackageSchema } from '../dto/packages.dto';

export const getPackages = async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user['id'];
  const query = packageQuerySchema.parse(req.query);
  
  const result = await PackageService.getPackages(userId, query);
  res.status(200).json(result);
};

export const synchronize = async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user['id'];
  
  const result = await PackageService.synchronize(userId);
  res.status(200).json(result);
};

export const updatePackage = async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user['id'];
  const packageId = req.params['id'] as string;
  const data = updatePackageSchema.parse(req.body);
  
  const result = await PackageService.updatePackage(userId, packageId, data);
  res.status(200).json(result);
};