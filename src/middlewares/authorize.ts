import { Request, Response, NextFunction, RequestHandler } from 'express';

// Если вы расширяли Request через declaration merging, то внутри Request уже есть поле user
// с типом { sub: string; role: 'seller'|'admin'|'user' }.

export const authorize = (...allowed: Array<'seller' | 'admin' | 'user'>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // req.user теперь имеет правильный тип из глобального расширения
    if (!req.user || !allowed.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
};
