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

    // Cookie configuration helper supporting local dev (HTTP) and production (HTTPS)
    _getCookieOptions(req, maxAge, path = '/') {
        const isProduction = process.env.NODE_ENV === 'production';
        const isSecure = Boolean(isProduction || req.secure || req.headers['x-forwarded-proto'] === 'https');
        const sameSite = isProduction ? 'none' : 'lax';
        return {
            httpOnly: true,
            secure: isSecure,
            sameSite,
            maxAge,
            path,
        };
    }

    // Arrow functions to maintain 'this' binding when used in Express routes
    
    register = async (req, res) => {
        try {
            const { username, email, password, mobileNumber, fullName } = req.body;
            if (!username || !email || !password || !mobileNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Username, email, password, and mobile number are required',
                    code: 'AUTH_INVALID_INPUT',
                    errorDetails: { code: 'AUTH_INVALID_INPUT', message: 'Username, email, password, and mobile number are required' }
                });
            }

            // Create active user record directly (handled in AuthService)
            const user = await this.authService.register(req.body);

            // Generate authentication session tokens
            const { generateToken, generateRefreshToken } = require('../utils/jwt');
            const crypto = require('crypto');
            const sessionId = crypto.randomUUID();

            try {
                const sessionService = require('../services/sessionService');
                await sessionService.createSession(user.id, sessionId, req.ip, req.get('User-Agent'));
            } catch {}

            const tokenPayload = { id: user.id, role: user.role, sessionId };
            const accessToken = generateToken(tokenPayload);
            const refreshToken = generateRefreshToken(tokenPayload);

            res.cookie('token', accessToken, this._getCookieOptions(req, 15 * 60 * 1000, '/'));
            res.cookie('refreshToken', refreshToken, this._getCookieOptions(req, 7 * 24 * 60 * 60 * 1000, '/api/auth/refresh'));

            res.status(201).json({
                success: true,
                authenticated: true,
                user: { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status },
                token: accessToken,
                refreshToken: refreshToken
            });
        } catch (err) {
            // Normalize duplicate database key errors/validation blocks generics to prevent account enumeration
            const isDup = (err.message.includes('already registered') || err.message.includes('duplicate') || err.code === 11000);
            const errMsg = isDup
                ? 'Username, email, or mobile number is already registered.'
                : (err.message.includes('required') ? err.message : 'Registration failed. Please verify your inputs.');
            const code = isDup ? 'AUTH_ACCOUNT_EXISTS' : 'AUTH_INVALID_INPUT';
            res.status(400).json({
                success: false,
                error: errMsg,
                code,
                errorDetails: { code, message: errMsg }
            });
        }
    }

    login = async (req, res) => {
        try {
            const { email, identity, password } = req.body;
            const loginId = (email || identity || '').trim();
            const ip = req.ip;
            const userAgent = req.get('User-Agent');

            const { user, accessToken, refreshToken } = await this.authService.login({ email: loginId, identity: loginId, password, ip, userAgent });

            res.cookie('token', accessToken, this._getCookieOptions(req, 15 * 60 * 1000, '/'));
            res.cookie('refreshToken', refreshToken, this._getCookieOptions(req, 7 * 24 * 60 * 60 * 1000, '/api/auth/refresh'));

            res.json({
                success: true,
                message: 'Login successful',
                user,
                token: accessToken,
                refreshToken: refreshToken
            });
        } catch (err) {
            const isSuspended = err.message && err.message.includes('suspended');
            const code = isSuspended ? 'AUTH_ACCOUNT_DISABLED' : 'AUTH_INVALID_CREDENTIALS';
            res.status(401).json({
                success: false,
                error: err.message,
                code,
                errorDetails: { code, message: err.message }
            });
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
                return res.status(403).json({
                    success: false,
                    error: 'Admin access required',
                    code: 'AUTH_FORBIDDEN',
                    errorDetails: { code: 'AUTH_FORBIDDEN', message: 'Admin access required' }
                });
            }

            res.cookie('token', accessToken, this._getCookieOptions(req, 15 * 60 * 1000, '/'));
            res.cookie('refreshToken', refreshToken, this._getCookieOptions(req, 7 * 24 * 60 * 60 * 1000, '/api/auth/refresh'));

            res.json({
                success: true,
                message: 'Admin login successful',
                user,
                token: accessToken,
                refreshToken: refreshToken
            });
        } catch (err) {
            const isSuspended = err.message && err.message.includes('suspended');
            const code = isSuspended ? 'AUTH_ACCOUNT_DISABLED' : 'AUTH_INVALID_CREDENTIALS';
            res.status(401).json({
                success: false,
                error: err.message,
                code,
                errorDetails: { code, message: err.message }
            });
        }
    }

    logout = async (req, res) => {
        try {
            const userId = req.user ? (req.user.id || req.user._id) : 'unknown';
            if (req.sessionId) {
                try {
                    const sessionService = require('../services/sessionService');
                    await sessionService.revokeSession(req.sessionId);
                } catch {}
            }
            await this.authService.logout(userId);
            
            const clearOpts = this._getCookieOptions(req, 0);
            res.clearCookie('token', { ...clearOpts, path: '/' });
            res.clearCookie('refreshToken', { ...clearOpts, path: '/api/auth/refresh' });
            res.json({ success: true, message: 'Logged out successfully' });
        } catch (err) {
            res.status(500).json({
                success: false,
                error: 'Logout failed',
                code: 'AUTH_SERVER_ERROR',
                errorDetails: { code: 'AUTH_SERVER_ERROR', message: 'Logout failed' }
            });
        }
    }

    refresh = async (req, res) => {
        try {
            const refreshTokenStr = req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];
            if (!refreshTokenStr) {
                return res.status(401).json({
                    success: false,
                    error: 'Refresh token is required',
                    code: 'AUTH_REFRESH_FAILED',
                    errorDetails: { code: 'AUTH_REFRESH_FAILED', message: 'Refresh token is required' }
                });
            }

            const { accessToken, refreshToken, user } = await this.authService.refreshToken(refreshTokenStr);

            res.cookie('token', accessToken, this._getCookieOptions(req, 15 * 60 * 1000, '/'));
            res.cookie('refreshToken', refreshToken, this._getCookieOptions(req, 7 * 24 * 60 * 60 * 1000, '/api/auth/refresh'));

            res.json({
                success: true,
                message: 'Token refreshed',
                token: accessToken,
                refreshToken: refreshToken,
                user: user || undefined
            });
        } catch (err) {
            res.status(401).json({
                success: false,
                error: err.message || 'Invalid or expired refresh token',
                code: 'AUTH_REFRESH_FAILED',
                errorDetails: { code: 'AUTH_REFRESH_FAILED', message: err.message || 'Invalid or expired refresh token' }
            });
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
