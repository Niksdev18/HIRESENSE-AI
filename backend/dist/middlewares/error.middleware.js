"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const errorHandler = (err, req, res, next) => {
    if (err instanceof errors_1.AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }
    console.error('💥 Unexpected error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
    });
};
exports.errorHandler = errorHandler;
