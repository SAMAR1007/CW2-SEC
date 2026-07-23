import { ZodObject, ZodRawShape } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate =
  (schema: ZodObject<ZodRawShape>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse({ body: req.body });
      if (!result.success) {
        const errorMessages = result.error.issues
          .map((issue) => issue.message)
          .join(', ');
        return res.status(400).json({ message: errorMessages });
      }
      next();
    } catch (err: any) {
      res.status(400).json({ message: 'Invalid request payload' });
    }
  };
