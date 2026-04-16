import { Request, Response } from 'express';
import { EmailService } from '../services/email.service';
import { AuthenticatedRequest } from '../types/request.types';

export const getGoogleAuthUrl = async (_req: Request, res: Response) => {
  const result = await EmailService.getGoogleAuthUrl();
  res.status(200).json(result);
};

export const handleGoogleCallback = async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user['id'];
  const result = await EmailService.handleGoogleCallback(userId, req.body.code);
  res.status(200).json(result);
};

export const linkEmailWithImap = async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user['id'];
  const result = await EmailService.linkEmailWithImap(userId, req.body.provider, req.body.email, req.body.password);
  res.status(200).json(result);
};

export const unlinkEmail = async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user['id'];
  const result = await EmailService.unlinkEmail(userId);
  res.status(200).json(result);
};