"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = __importDefault(require("../controllers/user.controller"));
const auth_1 = require("../middleware/auth");
const validator_1 = require("../middleware/validator");
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
router.get('/profile', auth_1.authenticate, user_controller_1.default.getProfile);
router.put('/profile', auth_1.authenticate, (0, validator_1.validate)(validators_1.updateProfileSchema), user_controller_1.default.updateProfile);
router.post('/avatar', auth_1.authenticate, user_controller_1.default.updateAvatar);
router.put('/password', auth_1.authenticate, (0, validator_1.validate)(validators_1.changePasswordSchema), user_controller_1.default.changePassword);
router.get('/activity', auth_1.authenticate, user_controller_1.default.getActivityLogs);
exports.default = router;
//# sourceMappingURL=user.routes.js.map