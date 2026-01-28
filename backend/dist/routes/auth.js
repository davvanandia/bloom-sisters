"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const authController_1 = require("../controllers/authController");
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = (0, express_1.Router)();
// Route debug untuk melihat semua user
router.get('/debug/users', async (req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                password: true, // Tampilkan password hash untuk debugging
                createdAt: true
            }
        });
        // Mask password for security logging
        const maskedUsers = users.map(user => ({
            ...user,
            password: user.password ?
                `[HASH: ${user.password.substring(0, 10)}...${user.password.substring(user.password.length - 5)}]` :
                null
        }));
        res.json({
            success: true,
            count: users.length,
            users: maskedUsers
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Route debug untuk test bcrypt
router.get('/debug/test-bcrypt', async (req, res) => {
    try {
        const testPassword = 'admin123';
        const hash = await bcryptjs_1.default.hash(testPassword, 10);
        const compareResult = await bcryptjs_1.default.compare(testPassword, hash);
        res.json({
            success: true,
            testPassword,
            hash,
            compareResult,
            hashLength: hash.length,
            hashStartsWith: hash.substring(0, 7)
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.post('/google', authController_1.googleAuth);
router.get('/verify', authController_1.verifyToken);
exports.default = router;
