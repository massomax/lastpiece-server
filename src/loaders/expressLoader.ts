import { Application, Request, Response } from 'express';
import express from 'express';
import cookieParser from 'cookie-parser';
import errorHandler from '../middlewares/errorHandler';
// роуты
import sellerRoutes from '../api/seller/sellerRoutes';

export const initExpress = (app: Application): void => {
  app.use(express.json());
  app.use(cookieParser());

  // health-check (можно убрать, если не нужно)
  app.get('/', (_req: Request, res: Response) => {
    res.send('🚀 LastPiece server is up and running!');
  });

  // v1 API
  app.use('/api/v1/sellers', sellerRoutes);

  app.use(errorHandler);
};
