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
            const user = await this.authService.register(req.body);
            res.status(201).json({ success: true, message: 'Account created successfully', user });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
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

    logout = async (req, res) => {
        try {
            const userId = req.user ? req.user.id : 'unknown';
            await this.authService.logout(userId);
            
            res.clearCookie('token');
            res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
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
}

module.exports = AuthController;
