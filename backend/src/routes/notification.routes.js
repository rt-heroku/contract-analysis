"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = __importDefault(require("../controllers/notification.controller"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, notification_controller_1.default.getNotifications);
router.get('/unread-count', auth_1.authenticate, notification_controller_1.default.getUnreadCount);
router.put('/:id/read', auth_1.authenticate, notification_controller_1.default.markAsRead);
router.put('/read-all', auth_1.authenticate, notification_controller_1.default.markAllAsRead);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map