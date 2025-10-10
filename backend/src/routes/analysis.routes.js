"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analysis_controller_1 = __importDefault(require("../controllers/analysis.controller"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/start', auth_1.authenticate, analysis_controller_1.default.startProcessing);
router.get('/', auth_1.authenticate, analysis_controller_1.default.getAnalysisHistory);
router.get('/statistics', auth_1.authenticate, analysis_controller_1.default.getStatistics);
router.get('/:id', auth_1.authenticate, analysis_controller_1.default.getAnalysis);
router.delete('/:id', auth_1.authenticate, analysis_controller_1.default.deleteAnalysis);
exports.default = router;
//# sourceMappingURL=analysis.routes.js.map