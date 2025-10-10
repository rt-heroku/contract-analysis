"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const upload_controller_1 = __importDefault(require("../controllers/upload.controller"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Configure multer for memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 52428800, // 50MB max
    },
});
router.post('/', auth_1.authenticate, upload.single('file'), upload_controller_1.default.uploadFile);
router.get('/', auth_1.authenticate, upload_controller_1.default.getUserUploads);
router.delete('/:id', auth_1.authenticate, upload_controller_1.default.deleteUpload);
exports.default = router;
//# sourceMappingURL=upload.routes.js.map