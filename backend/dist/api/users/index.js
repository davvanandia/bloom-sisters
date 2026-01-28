"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//backend/src/api/users/index.ts
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const router = (0, express_1.Router)();
// Apply auth middleware untuk semua routes
router.use(auth_1.authMiddleware);
// Helper untuk mendapatkan user dari request dengan type safety
const getAuthUser = (req) => {
    return req.user;
};
// GET /api/users - Get all users (Superadmin/Admin only)
router.get('/', (0, auth_1.roleMiddleware)(['SUPERADMIN', 'ADMIN']), async (req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            success: true,
            data: users,
            count: users.length
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = getAuthUser(req);
        if (!currentUser) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        // Jika bukan admin/superadmin, hanya bisa akses profil sendiri
        if (currentUser.role !== 'SUPERADMIN' && currentUser.role !== 'ADMIN' && currentUser.userId !== id) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden: You can only access your own profile'
            });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// POST /api/users - Create new user (Superadmin only)
router.post('/', (0, auth_1.roleMiddleware)(['SUPERADMIN']), async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        // Validasi
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username, email, and password are required'
            });
        }
        // Check if user exists
        const existingUser = await prisma_1.default.user.findFirst({
            where: {
                OR: [{ email }, { username }]
            }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User already exists'
            });
        }
        // Hash password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create user
        const user = await prisma_1.default.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role: role || 'USER'
            }
        });
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: userWithoutPassword
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, role } = req.body;
        const currentUser = getAuthUser(req);
        if (!currentUser) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        // Check if user exists
        const existingUser = await prisma_1.default.user.findUnique({ where: { id } });
        if (!existingUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        // Validasi: Non-admin hanya bisa update profil sendiri
        if (currentUser.role !== 'SUPERADMIN' && currentUser.role !== 'ADMIN' && currentUser.userId !== id) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden: You can only update your own profile'
            });
        }
        // Validasi: Non-superadmin tidak bisa mengubah role
        if (currentUser.role !== 'SUPERADMIN' && role && role !== existingUser.role) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden: Only superadmin can change user roles'
            });
        }
        // Update user
        const user = await prisma_1.default.user.update({
            where: { id },
            data: {
                username: username || existingUser.username,
                email: email || existingUser.email,
                role: currentUser.role === 'SUPERADMIN' ? (role || existingUser.role) : existingUser.role
            }
        });
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            message: 'User updated successfully',
            data: userWithoutPassword
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// DELETE /api/users/:id - Delete user (Superadmin only)
router.delete('/:id', (0, auth_1.roleMiddleware)(['SUPERADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        // Check if user exists
        const existingUser = await prisma_1.default.user.findUnique({ where: { id } });
        if (!existingUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        // Delete user
        await prisma_1.default.user.delete({ where: { id } });
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// PUT /api/users/:id/status - Change user status
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const currentUser = getAuthUser(req);
        if (!currentUser) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        // Check if user exists
        const existingUser = await prisma_1.default.user.findUnique({ where: { id } });
        if (!existingUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        // Hanya admin/superadmin yang bisa mengubah status
        if (currentUser.role !== 'SUPERADMIN' && currentUser.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Forbidden: Only admin can change user status'
            });
        }
        // Update user status
        // Note: Anda perlu menambahkan field 'status' di model User jika ingin menyimpan status
        res.json({
            success: true,
            message: `User status updated to ${status}`,
            data: { id, status }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
