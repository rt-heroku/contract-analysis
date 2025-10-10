"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const auth_1 = require("../middleware/auth");
const validator_1 = require("../middleware/validator");
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
router.post('/register', (0, validator_1.validate)(validators_1.registerSchema), auth_controller_1.default.register);
router.post('/login', (0, validator_1.validate)(validators_1.loginSchema), auth_controller_1.default.login);
router.post('/logout', auth_1.authenticate, auth_controller_1.default.logout);
router.post('/refresh', auth_1.authenticate, auth_controller_1.default.refreshToken);
router.get('/me', auth_1.authenticate, auth_controller_1.default.getCurrentUser);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map