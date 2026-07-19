"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const candidate_controller_1 = require("../controllers/candidate.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Multer memory storage setup with 5MB file cap
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});
router.post('/upload-resume', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)(['Candidate']), upload.single('resume'), candidate_controller_1.uploadResume);
router.delete('/resume', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)(['Candidate']), candidate_controller_1.deleteResume);
router.put('/profile', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)(['Candidate']), candidate_controller_1.updateProfile);
router.get('/profile', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)(['Candidate']), candidate_controller_1.getProfile);
exports.default = router;
