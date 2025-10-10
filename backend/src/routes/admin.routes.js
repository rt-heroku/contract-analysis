"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = __importDefault(require("../controllers/admin.controller"));
const auth_1 = require("../middleware/auth");
const roleCheck_1 = require("../middleware/roleCheck");
const validator_1 = require("../middleware/validator");
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
// All routes require authentication and admin role
router.use(auth_1.authenticate);
router.use(roleCheck_1.requireAdmin);
// User management
router.get('/users', admin_controller_1.default.getUsers);
router.get('/users/:id', admin_controller_1.default.getUser);
router.put('/users/:id', (0, validator_1.validate)(validators_1.updateUserSchema), admin_controller_1.default.updateUser);
router.delete('/users/:id', admin_controller_1.default.deleteUser);
router.post('/users/:id/reset-password', admin_controller_1.default.resetUserPassword);
// Logs
router.get('/activity-logs', admin_controller_1.default.getActivityLogs);
router.get('/api-logs', admin_controller_1.default.getApiLogs);
// Settings
router.get('/settings', admin_controller_1.default.getSystemSettings);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map