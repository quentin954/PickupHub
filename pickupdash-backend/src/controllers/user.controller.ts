import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthenticatedRequest } from '../types/request.types';

export const getMe = async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user.id;
  const result = await UserService.getMe(userId);
  res.status(200).json(result);
};