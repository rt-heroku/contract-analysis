"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const system_controller_1 = __importDefault(require("../controllers/system.controller"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/menu', auth_1.authenticate, system_controller_1.default.getMenu);
router.get('/settings', system_controller_1.default.getPublicSettings);
exports.default = router;
//# sourceMappingURL=system.routes.js.map