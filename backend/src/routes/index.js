"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const upload_routes_1 = __importDefault(require("./upload.routes"));
const analysis_routes_1 = __importDefault(require("./analysis.routes"));
const notification_routes_1 = __importDefault(require("./notification.routes"));
const admin_routes_1 = __importDefault(require("./admin.routes"));
const system_routes_1 = __importDefault(require("./system.routes"));
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/uploads', upload_routes_1.default);
router.use('/analysis', analysis_routes_1.default);
router.use('/notifications', notification_routes_1.default);
router.use('/admin', admin_routes_1.default);
router.use('/system', system_routes_1.default);
// Health check
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
exports.default = router;
//# sourceMappingURL=index.js.map