"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const auth_1 = require("../../middleware/auth");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
// Apply auth middleware to all profile routes
router.use(auth_1.authMiddleware);
// GET /api/profile - Get current user profile
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const userData = await prisma_1.default.user.findUnique({
            where: { id: user.userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                // Count related data
                _count: {
                    select: {
                        orders: true,
                        activityLogs: true
                    }
                }
            }
        });
        if (!userData) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        res.json({
            success: true,
            data: userData
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch profile'
        });
    }
});
// PUT /api/profile - Update profile information
router.put('/', async (req, res) => {
    try {
        const user = req.user;
        const { username, email } = req.body;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        // Validate input
        if (!username || !email) {
            return res.status(400).json({
                success: false,
                error: 'Username and email are required'
            });
        }
        // Check if email already exists (for other users)
        const existingEmail = await prisma_1.default.user.findFirst({
            where: {
                email,
                NOT: { id: user.userId }
            }
        });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                error: 'Email already in use by another account'
            });
        }
        // Check if username already exists (for other users)
        const existingUsername = await prisma_1.default.user.findFirst({
            where: {
                username,
                NOT: { id: user.userId }
            }
        });
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                error: 'Username already in use by another account'
            });
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Please enter a valid email address'
            });
        }
        // Update user
        const updatedUser = await prisma_1.default.user.update({
            where: { id: user.userId },
            data: {
                username,
                email,
                updatedAt: new Date()
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });
        // Generate new token with updated info
        const newToken = jsonwebtoken_1.default.sign({
            userId: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role
        }, process.env.JWT_SECRET || 'bloom-sisters-secret-key-2024', { expiresIn: '7d' });
        // Log the profile update
        await prisma_1.default.activityLog.create({
            data: {
                userId: user.userId,
                action: 'PROFILE_UPDATED',
                details: 'Updated profile information',
                ipAddress: req.ip
            }
        });
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser,
            token: newToken
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update profile'
        });
    }
});
// PUT /api/profile/password - Change password
router.put('/password', async (req, res) => {
    try {
        const user = req.user;
        const { currentPassword, newPassword, confirmPassword } = req.body;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'All password fields are required'
            });
        }
        // Check if new password matches confirmation
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'New password and confirmation do not match'
            });
        }
        // Validate new password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long'
            });
        }
        // Get current user with password
        const currentUser = await prisma_1.default.user.findUnique({
            where: { id: user.userId }
        });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        // Check current password
        const isValid = await bcryptjs_1.default.compare(currentPassword, currentUser.password || '');
        if (!isValid) {
            return res.status(400).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }
        // Hash new password
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        // Update password
        await prisma_1.default.user.update({
            where: { id: user.userId },
            data: {
                password: hashedPassword,
                updatedAt: new Date()
            }
        });
        // Log the password change
        await prisma_1.default.activityLog.create({
            data: {
                userId: user.userId,
                action: 'PASSWORD_CHANGED',
                details: 'Changed account password',
                ipAddress: req.ip
            }
        });
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to change password'
        });
    }
});
// DELETE /api/profile - Delete account (with confirmation)
router.delete('/', async (req, res) => {
    try {
        const user = req.user;
        const { confirmation, password } = req.body;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        // Validate confirmation
        if (confirmation !== 'DELETE MY ACCOUNT') {
            return res.status(400).json({
                success: false,
                error: 'Please type "DELETE MY ACCOUNT" to confirm deletion'
            });
        }
        // Get current user with password
        const currentUser = await prisma_1.default.user.findUnique({
            where: { id: user.userId }
        });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        // Verify password for account deletion
        const isValid = await bcryptjs_1.default.compare(password, currentUser.password || '');
        if (!isValid) {
            return res.status(400).json({
                success: false,
                error: 'Password is incorrect'
            });
        }
        // Check if user is SUPERADMIN (prevent deleting the last superadmin)
        if (currentUser.role === 'SUPERADMIN') {
            const superadminCount = await prisma_1.default.user.count({
                where: { role: 'SUPERADMIN' }
            });
            if (superadminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Cannot delete the last SUPERADMIN account'
                });
            }
        }
        // Delete user's orders and related data first
        // Find user's orders
        const userOrders = await prisma_1.default.order.findMany({
            where: { userId: user.userId },
            select: { id: true }
        });
        // Delete order items for each order
        for (const order of userOrders) {
            await prisma_1.default.orderItem.deleteMany({
                where: { orderId: order.id }
            });
        }
        // Delete user's orders
        await prisma_1.default.order.deleteMany({
            where: { userId: user.userId }
        });
        // Delete user's activity logs
        await prisma_1.default.activityLog.deleteMany({
            where: { userId: user.userId }
        });
        // Delete the user
        await prisma_1.default.user.delete({
            where: { id: user.userId }
        });
        // Log this action (won't be saved since user is deleted, but we can log it elsewhere)
        console.log(`User ${user.userId} (${currentUser.email}) deleted their account`);
        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete account'
        });
    }
});
// GET /api/profile/stats - Get user statistics
router.get('/stats', async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);
        // Get user statistics
        const [totalOrders, pendingOrders, completedOrders, recentActivity, orderStats] = await Promise.all([
            // Total orders
            prisma_1.default.order.count({
                where: { userId: user.userId }
            }),
            // Pending orders
            prisma_1.default.order.count({
                where: {
                    userId: user.userId,
                    status: 'PENDING'
                }
            }),
            // Completed orders
            prisma_1.default.order.count({
                where: {
                    userId: user.userId,
                    status: 'COMPLETED'
                }
            }),
            // Recent activity (last 5 logs)
            prisma_1.default.activityLog.findMany({
                where: { userId: user.userId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    action: true,
                    details: true,
                    createdAt: true
                }
            }),
            // Order statistics by status
            prisma_1.default.order.groupBy({
                by: ['status'],
                where: { userId: user.userId },
                _count: {
                    id: true
                }
            })
        ]);
        // Calculate total spent
        const completedOrdersData = await prisma_1.default.order.findMany({
            where: {
                userId: user.userId,
                status: 'COMPLETED'
            },
            select: { total: true }
        });
        const totalSpent = completedOrdersData.reduce((sum, order) => sum + order.total, 0);
        // Format recent activity
        const formattedActivity = recentActivity.map(activity => ({
            action: activity.action,
            details: activity.details,
            time: activity.createdAt
        }));
        // Format order stats
        const formattedOrderStats = {
            PENDING: 0,
            PROCESSING: 0,
            COMPLETED: 0,
            CANCELLED: 0
        };
        orderStats.forEach(stat => {
            formattedOrderStats[stat.status] = stat._count.id;
        });
        res.json({
            success: true,
            data: {
                totalOrders,
                pendingOrders,
                completedOrders,
                totalSpent,
                recentActivity: formattedActivity,
                orderStats: formattedOrderStats
            }
        });
    }
    catch (error) {
        console.error('Get profile stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch profile statistics'
        });
    }
});
exports.default = router;
