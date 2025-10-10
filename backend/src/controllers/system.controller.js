"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const types_1 = require("../types");
const database_1 = __importDefault(require("../config/database"));
class SystemController {
    async getMenu(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            // Get user roles
            const userRoles = await database_1.default.userRole.findMany({
                where: { userId: req.user.id },
                include: { role: true },
            });
            const roleIds = userRoles.map((ur) => ur.roleId);
            // Get menu items accessible by user's roles
            const menuPermissions = await database_1.default.menuPermission.findMany({
                where: {
                    roleId: {
                        in: roleIds,
                    },
                },
                include: {
                    menuItem: true,
                },
            });
            // Get unique menu items
            const menuItemIds = [...new Set(menuPermissions.map((mp) => mp.menuItemId))];
            const menuItems = await database_1.default.menuItem.findMany({
                where: {
                    id: {
                        in: menuItemIds,
                    },
                    isActive: true,
                },
                orderBy: {
                    orderIndex: 'asc',
                },
            });
            // Build menu tree
            const menuTree = this.buildMenuTree(menuItems);
            res.json({ menu: menuTree });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    buildMenuTree(items) {
        const itemMap = new Map();
        const rootItems = [];
        // Create map of all items
        items.forEach((item) => {
            itemMap.set(item.id, { ...item, children: [] });
        });
        // Build tree
        items.forEach((item) => {
            const mappedItem = itemMap.get(item.id);
            if (item.parentId === null) {
                rootItems.push(mappedItem);
            }
            else {
                const parent = itemMap.get(item.parentId);
                if (parent) {
                    parent.children.push(mappedItem);
                }
            }
        });
        return rootItems;
    }
    async getPublicSettings(_req, res) {
        try {
            const settings = await database_1.default.systemSetting.findMany({
                where: { isSecret: false },
                select: {
                    settingKey: true,
                    settingValue: true,
                    description: true,
                },
            });
            // Convert to key-value object
            const settingsObj = settings.reduce((acc, setting) => {
                acc[setting.settingKey] = setting.settingValue;
                return acc;
            }, {});
            res.json({ settings: settingsObj });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.default = new SystemController();
//# sourceMappingURL=system.controller.js.map