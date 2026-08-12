/**
 * @module AuthController
 * @description HTTP Adapter for AuthService.
 */
class AuthController {
    /**
     * @param {Object} deps 
     * @param {import('../services/auth/AuthService')} deps.authService
     * @param {import('../services/auth/RoleService')} deps.roleService
     */
    constructor(deps) {
        this.authService = deps.authService;
        this.roleService = deps.roleService;
    }

    // Arrow functions to maintain 'this' binding when used in Express routes
    
    register = async (req, res) => {
        try {
            const { username, email, password, mobileNumber, fullName } = req.body;
            if (!username || !email || !password || !mobileNumber) {
                return res.status(400).json({ success: false, error: 'Username, email, password, and mobile number are required' });
            }

            // Create active user record directly (handled in AuthService)
            const user = await this.authService.register(req.body);

            // Generate authentication session tokens
            const { generateToken, generateRefreshToken } = require('../utils/jwt');
            const tokenPayload = { id: user.id, role: user.role };
            const accessToken = generateToken(tokenPayload);
            const refreshToken = generateRefreshToken(tokenPayload);

            const cookieSameSite = process.env.NODE_ENV === 'production' ? 'none' : 'strict';
            res.cookie('token', accessToken, {
                httpOnly: true,
                secure: true,
                sameSite: cookieSameSite,
                maxAge: 15 * 60 * 1000
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: cookieSameSite,
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/api/auth/refresh'
            });

            res.status(201).json({
                success: true,
                authenticated: true,
                user: { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status },
                token: accessToken
            });
        } catch (err) {
            // Normalize duplicate database key errors/validation blocks generics to prevent account enumeration
            const errMsg = (err.message.includes('already registered') || err.message.includes('duplicate') || err.code === 11000)
                ? 'Username, email, or mobile number is already registered.'
                : 'Registration failed. Please verify your inputs.';
            res.status(400).json({ success: false, error: errMsg });
        }
    }

    login = async (req, res) => {
        try {
            const { email, password } = req.body;
            const ip = req.ip;
            const userAgent = req.get('User-Agent');

            const { user, accessToken, refreshToken } = await this.authService.login({ email, password, ip, userAgent });

            // Set secure cookies
            const cookieSameSite = process.env.NODE_ENV === 'production' ? 'none' : 'strict';
            res.cookie('token', accessToken, {
                httpOnly: true,
                secure: true,
                sameSite: cookieSameSite,
                maxAge: 15 * 60 * 1000 // 15 minutes
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: cookieSameSite,
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/api/auth/refresh'
            });

            res.json({ success: true, message: 'Login successful', user, token: accessToken });
        } catch (err) {
            res.status(401).json({ success: false, error: err.message });
        }
    }

    adminLogin = async (req, res) => {
        try {
            const { email, identity, password } = req.body;
            const loginIdentifier = email || identity;
            const ip = req.ip;
            const userAgent = req.get('User-Agent');

            const { user, accessToken, refreshToken } = await this.authService.login({ email: loginIdentifier, password, ip, userAgent });

            if (user.role !== 'admin') {
                return res.status(403).json({ success: false, error: 'Admin access required' });
            }

            const cookieSameSite = process.env.NODE_ENV === 'production' ? 'none' : 'strict';
            res.cookie('token', accessToken, {
                httpOnly: true,
                secure: true,
                sameSite: cookieSameSite,
                maxAge: 15 * 60 * 1000
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: cookieSameSite,
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/api/auth/refresh'
            });

            res.json({ success: true, message: 'Admin login successful', user, token: accessToken });
        } catch (err) {
            res.status(401).json({ success: false, error: err.message });
        }
    }

    logout = async (req, res) => {
        try {
            const userId = req.user ? req.user.id : 'unknown';
            await this.authService.logout(userId);
            
            const cookieSameSite = process.env.NODE_ENV === 'production' ? 'none' : 'strict';
            res.clearCookie('token', {
                httpOnly: true,
                secure: true,
                sameSite: cookieSameSite
            });
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: true,
                sameSite: cookieSameSite,
                path: '/api/auth/refresh'
            });
            res.json({ success: true, message: 'Logged out successfully' });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Logout failed' });
        }
    }

    refresh = async (req, res) => {
        try {
            const refreshTokenStr = req.cookies?.refreshToken;
            const { accessToken, refreshToken } = await this.authService.refreshToken(refreshTokenStr);

            const cookieSameSite = process.env.NODE_ENV === 'production' ? 'none' : 'strict';
            res.cookie('token', accessToken, {
                httpOnly: true,
                secure: true,
                sameSite: cookieSameSite,
                maxAge: 15 * 60 * 1000
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: cookieSameSite,
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/api/auth/refresh'
            });

            res.json({ success: true, message: 'Token refreshed', token: accessToken });
        } catch (err) {
            res.status(401).json({ success: false, error: err.message });
        }
    }

    requestPasswordReset = async (req, res) => {
        try {
            await this.authService.requestPasswordReset(req.body.email);
            res.json({ success: true, message: 'If an account exists, a reset code was generated.' });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    resetPassword = async (req, res) => {
        try {
            await this.authService.resetPassword(req.body.email, req.body.password);
            res.json({ success: true, message: 'Password reset successful' });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    getProfile = async (req, res) => {
        try {
            res.json({ success: true, user: req.user });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Failed to fetch profile' });
        }
    }

    updateProfile = async (req, res) => {
        try {
            const user = await this.authService.updateProfile(req.user.id, req.body);
            res.json({ success: true, message: 'Profile updated', user });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    getRoles = async (req, res) => {
        try {
            const roles = await this.roleService.listRoles();
            res.json({ success: true, roles });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Failed to retrieve roles' });
        }
    }

    getPermissions = async (req, res) => {
        try {
            const permissions = await this.roleService.listPermissions();
            res.json({ success: true, permissions });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Failed to retrieve permissions' });
        }
    }

    /**
     * Email risk check — analyse an email address for disposability, MX validity,
     * and known risk indicators using the EmailRisk service.
     * Route: POST /api/auth/email-check  (authenticated)
     */
    emailCheck = async (req, res) => {
        try {
            const { analyzeEmailRisk } = require('../services/emailRisk');
            const result = await analyzeEmailRisk(req.body.email);
            res.json({ success: true, analysis: result });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    checkUsername = async (req, res) => {
        try {
            const { username } = req.body;
            if (!username) return res.status(400).json({ success: false, error: 'Username is required' });
            const normalized = username.trim().toLowerCase();
            
            // Check if user exists using the user repo
            const exists = await this.authService.userRepo.exists({ username: normalized });
            if (exists) {
                const suggestions = [
                    `${normalized}${Math.floor(10 + Math.random() * 90)}`,
                    `${normalized}_nx`,
                    `op_${normalized}`
                ];
                return res.json({ success: true, available: false, suggestions });
            }
            return res.json({ success: true, available: true });
        } catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }

    requestEmailOtp = async (req, res) => {
        try {
            const { requestEmailOtp } = require('../services/emailVerification');
            const result = await requestEmailOtp(req.body.email);
            res.json(result);
        } catch (err) {
            res.status(err.status || 400).json({ error: err.message });
        }
    }

    verifyEmailOtp = async (req, res) => {
        try {
            const { verifyEmailOtp } = require('../services/emailVerification');
            const result = await verifyEmailOtp(req.body.email, req.body.otp);
            res.json(result);
        } catch (err) {
            res.status(err.status || 400).json({ error: err.message });
        }
    }
}

module.exports = AuthController;
