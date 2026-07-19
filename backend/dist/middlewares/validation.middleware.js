"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
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
exports.validate = validate;
