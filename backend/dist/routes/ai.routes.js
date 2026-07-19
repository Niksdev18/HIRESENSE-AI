"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("../controllers/ai.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Protect all endpoints with JWT auth and enforce specific rate limit profiles
router.post('/analyze-resume', auth_middleware_1.authenticate, ai_controller_1.analysisLimiter, ai_controller_1.analyzeResume);
router.post('/match-job', auth_middleware_1.authenticate, ai_controller_1.analysisLimiter, ai_controller_1.matchJob);
router.post('/improve-resume', auth_middleware_1.authenticate, ai_controller_1.generationLimiter, ai_controller_1.improveResume);
router.post('/generate-questions', auth_middleware_1.authenticate, ai_controller_1.generationLimiter, ai_controller_1.generateQuestionsEndpoint);
router.post('/generate-cover-letter', auth_middleware_1.authenticate, ai_controller_1.generationLimiter, ai_controller_1.generateCoverLetterEndpoint);
exports.default = router;
