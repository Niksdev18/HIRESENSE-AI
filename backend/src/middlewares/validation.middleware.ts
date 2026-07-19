import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Construct clear error message using Zod's official .issues array
        const message = error.issues
          .map((e) => {
            const field = e.path.join('.');
            return `${field}: ${e.message}`;
          })
          .join(', ');
        res.status(400).json({
          success: false,
          message: `Validation Error: ${message}`,
        });
        return;
      }
      next(error);
    }
  };
};
