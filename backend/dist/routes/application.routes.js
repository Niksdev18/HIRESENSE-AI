"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const application_controller_1 = require("../controllers/application.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Candidate endpoints
router.post('/apply/:jobId', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)(['Candidate']), application_controller_1.applyJob);
router.get('/candidate', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)(['Candidate']), application_controller_1.getCandidateApplications);
router.post('/save/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)(['Candidate']), application_controller_1.saveJob);
router.delete('/unsave/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)(['Candidate']), application_controller_1.unsaveJob);
router.get('/saved', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)(['Candidate']), application_controller_1.getSavedJobs);
// HR applicant reviews and status updates
router.get('/job/:jobId', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)(['HR', 'Admin']), application_controller_1.getJobApplicants);
router.put('/:id/status', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)(['HR', 'Admin']), application_controller_1.updateApplicationStatus);
router.get('/pool', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)(['HR', 'Admin']), application_controller_1.getAllCandidates);
exports.default = router;
