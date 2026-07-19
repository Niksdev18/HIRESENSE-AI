"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const error_middleware_1 = require("./middlewares/error.middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const job_routes_1 = __importDefault(require("./routes/job.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const candidate_routes_1 = __importDefault(require("./routes/candidate.routes"));
const application_routes_1 = __importDefault(require("./routes/application.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
// Security Middlewares
app.use((0, helmet_1.default)());
// CORS configuration - dynamic based on ALLOWED_ORIGINS env
const origins = env_1.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || origins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
// Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes',
    },
});
app.use(limiter);
// Parsers
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Root endpoint for simple checks
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the HireSense AI API',
        version: '1.0.0',
    });
});
// App Routes
app.use('/health', health_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/jobs', job_routes_1.default);
app.use('/api/candidate', candidate_routes_1.default);
app.use('/api/applications', application_routes_1.default);
app.use('/api/ai', ai_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../public/uploads')));
// Global Error Handler
app.use(error_middleware_1.errorHandler);
// Start server if not running tests
if (env_1.env.NODE_ENV !== 'test') {
    app.listen(env_1.env.PORT, () => {
        console.log(`🚀 Server running on port ${env_1.env.PORT} in ${env_1.env.NODE_ENV} mode`);
    });
}
exports.default = app;
