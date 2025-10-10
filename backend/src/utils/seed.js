"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("./logger"));
async function seed() {
    try {
        logger_1.default.info('Starting database seeding...');
        // Create roles
        const adminRole = await database_1.default.role.upsert({
            where: { name: 'admin' },
            update: {},
            create: {
                name: 'admin',
                description: 'Administrator with full access',
            },
        });
        const userRole = await database_1.default.role.upsert({
            where: { name: 'user' },
            update: {},
            create: {
                name: 'user',
                description: 'Regular user with limited access',
            },
        });
        logger_1.default.info('Roles created');
        // Create menu items
        await database_1.default.menuItem.upsert({
            where: { id: 1 },
            update: {},
            create: {
                title: 'Dashboard',
                icon: 'home',
                route: '/dashboard',
                orderIndex: 1,
            },
        });
        await database_1.default.menuItem.upsert({
            where: { id: 2 },
            update: {},
            create: {
                title: 'Profile',
                icon: 'user',
                route: '/profile',
                orderIndex: 2,
            },
        });
        await database_1.default.menuItem.upsert({
            where: { id: 3 },
            update: {},
            create: {
                title: 'Document Processing',
                icon: 'file-text',
                route: '/processing',
                orderIndex: 3,
            },
        });
        await database_1.default.menuItem.upsert({
            where: { id: 4 },
            update: {},
            create: {
                title: 'Analysis History',
                icon: 'history',
                route: '/history',
                orderIndex: 4,
            },
        });
        const transactionsMenu = await database_1.default.menuItem.upsert({
            where: { id: 5 },
            update: {},
            create: {
                title: 'Transactions',
                icon: 'credit-card',
                route: null,
                orderIndex: 5,
            },
        });
        await database_1.default.menuItem.upsert({
            where: { id: 6 },
            update: {},
            create: {
                parentId: transactionsMenu.id,
                title: 'Transaction History',
                icon: 'list',
                route: '/transactions',
                orderIndex: 1,
            },
        });
        const adminPanelMenu = await database_1.default.menuItem.upsert({
            where: { id: 7 },
            update: {},
            create: {
                title: 'Admin Panel',
                icon: 'shield',
                route: null,
                orderIndex: 6,
            },
        });
        await database_1.default.menuItem.upsert({
            where: { id: 8 },
            update: {},
            create: {
                parentId: adminPanelMenu.id,
                title: 'User Management',
                icon: 'users',
                route: '/admin/users',
                orderIndex: 1,
            },
        });
        await database_1.default.menuItem.upsert({
            where: { id: 9 },
            update: {},
            create: {
                parentId: adminPanelMenu.id,
                title: 'System Logs',
                icon: 'file-text',
                route: '/admin/logs',
                orderIndex: 2,
            },
        });
        await database_1.default.menuItem.upsert({
            where: { id: 10 },
            update: {},
            create: {
                title: 'Settings',
                icon: 'settings',
                route: '/settings',
                orderIndex: 7,
            },
        });
        logger_1.default.info('Menu items created');
        // Get all menu items
        const allMenuItems = await database_1.default.menuItem.findMany();
        // Assign all menu items to admin role
        for (const menuItem of allMenuItems) {
            await database_1.default.menuPermission.upsert({
                where: {
                    menuItemId_roleId: {
                        menuItemId: menuItem.id,
                        roleId: adminRole.id,
                    },
                },
                update: {},
                create: {
                    menuItemId: menuItem.id,
                    roleId: adminRole.id,
                },
            });
        }
        // Assign non-admin menu items to user role
        const userMenuItems = allMenuItems.filter((item) => item.title !== 'Admin Panel' && item.parentId !== adminPanelMenu.id);
        for (const menuItem of userMenuItems) {
            await database_1.default.menuPermission.upsert({
                where: {
                    menuItemId_roleId: {
                        menuItemId: menuItem.id,
                        roleId: userRole.id,
                    },
                },
                update: {},
                create: {
                    menuItemId: menuItem.id,
                    roleId: userRole.id,
                },
            });
        }
        logger_1.default.info('Menu permissions created');
        // Create system settings
        await database_1.default.systemSetting.upsert({
            where: { settingKey: 'mulesoft_api_base_url' },
            update: {},
            create: {
                settingKey: 'mulesoft_api_base_url',
                settingValue: process.env.MULESOFT_API_BASE_URL || 'https://api.mulesoft.example.com',
                description: 'MuleSoft API base URL',
                isSecret: false,
            },
        });
        await database_1.default.systemSetting.upsert({
            where: { settingKey: 'app_name' },
            update: {},
            create: {
                settingKey: 'app_name',
                settingValue: 'Document Processing App',
                description: 'Application name',
                isSecret: false,
            },
        });
        await database_1.default.systemSetting.upsert({
            where: { settingKey: 'powered_by_text' },
            update: {},
            create: {
                settingKey: 'powered_by_text',
                settingValue: 'Powered by Your Company',
                description: 'Footer text',
                isSecret: false,
            },
        });
        logger_1.default.info('System settings created');
        // Create admin user
        const adminPasswordHash = await bcrypt_1.default.hash('Admin@123', 10);
        const adminUser = await database_1.default.user.upsert({
            where: { email: 'admin@demo.com' },
            update: {},
            create: {
                email: 'admin@demo.com',
                passwordHash: adminPasswordHash,
                firstName: 'Admin',
                lastName: 'User',
            },
        });
        await database_1.default.userProfile.upsert({
            where: { userId: adminUser.id },
            update: {},
            create: {
                userId: adminUser.id,
            },
        });
        await database_1.default.userRole.upsert({
            where: {
                userId_roleId: {
                    userId: adminUser.id,
                    roleId: adminRole.id,
                },
            },
            update: {},
            create: {
                userId: adminUser.id,
                roleId: adminRole.id,
            },
        });
        logger_1.default.info('Admin user created (email: admin@demo.com, password: Admin@123)');
        // Create regular user
        const userPasswordHash = await bcrypt_1.default.hash('User@123', 10);
        const regularUser = await database_1.default.user.upsert({
            where: { email: 'user@demo.com' },
            update: {},
            create: {
                email: 'user@demo.com',
                passwordHash: userPasswordHash,
                firstName: 'Regular',
                lastName: 'User',
            },
        });
        await database_1.default.userProfile.upsert({
            where: { userId: regularUser.id },
            update: {},
            create: {
                userId: regularUser.id,
            },
        });
        await database_1.default.userRole.upsert({
            where: {
                userId_roleId: {
                    userId: regularUser.id,
                    roleId: userRole.id,
                },
            },
            update: {},
            create: {
                userId: regularUser.id,
                roleId: userRole.id,
            },
        });
        logger_1.default.info('Regular user created (email: user@demo.com, password: User@123)');
        logger_1.default.info('Database seeding completed successfully!');
    }
    catch (error) {
        logger_1.default.error('Error seeding database:', error);
        throw error;
    }
    finally {
        await database_1.default.$disconnect();
    }
}
seed();
//# sourceMappingURL=seed.js.map