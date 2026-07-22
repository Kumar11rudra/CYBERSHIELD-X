const bcrypt = require('bcryptjs');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const crypto = require('crypto');

/**
 * @module AuthService
 * @description Handles core business logic for authentication and user management.
 * Relies entirely on Dependency Injection for persistence and events.
 */
class AuthService {
    /**
     * @param {Object} deps
     * @param {import('./UserRepository')} deps.userRepo
     * @param {import('../chatbot_core/events/EventPublisher')} deps.eventPublisher
     */
    constructor(deps) {
        this.userRepo = deps.userRepo;
        this.eventPublisher = deps.eventPublisher;
    }

    /**
     * Hash password
     */
    async hashPassword(password) {
        const salt = await bcrypt.genSalt(12);
        return bcrypt.hash(password, salt);
    }

    /**
     * Compare password
     */
    async comparePassword(candidate, hash) {
        return bcrypt.compare(candidate, hash);
    }

    /**
     * Register a new user
     */
    async register({ username, email, password }) {
        if (!username || !email || !password) {
            throw new Error('Username, email, and password are required');
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const existing = await this.userRepo.findOne({ email: normalizedEmail });
        if (existing) {
            throw new Error('Email is already in use');
        }

        const hashedPassword = await this.hashPassword(password);
        
        const userData = {
            username: String(username).trim(),
            email: String(email).toLowerCase().trim(),
            password: hashedPassword,
            role: 'user', // default role
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const savedUser = await this.userRepo.create(userData);

        // Omit password from result DTO
        const userDTO = { id: savedUser.id, username: savedUser.username, email: savedUser.email, role: savedUser.role };

        // Publish event
        await this.eventPublisher.publish({
            type: 'UserRegistered',
            source: 'AuthService',
            payload: { userId: userDTO.id, email: userDTO.email }
        });

        return userDTO;
    }

    /**
     * Login user
     */
    async login({ email, password, ip, userAgent }) {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await this.userRepo.findOne({ email: normalizedEmail });
        if (!user) {
            await this.eventPublisher.publish({
                type: 'UserLoginFailed',
                source: 'AuthService',
                payload: { email, reason: 'User not found', ip }
            });
            throw new Error('Invalid credentials');
        }

        const isMatch = await this.comparePassword(password, user.password);
        if (!isMatch) {
            await this.eventPublisher.publish({
                type: 'UserLoginFailed',
                source: 'AuthService',
                payload: { email, reason: 'Invalid password', ip }
            });
            throw new Error('Invalid credentials');
        }

        // Generate tokens
        const tokenPayload = { id: user._id, role: user.role };
        const accessToken = generateToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        await this.userRepo.update({ id: user._id, lastLoginAt: new Date() });

        const userDTO = { id: user._id, username: user.username, email: user.email, role: user.role };

        // Publish event
        await this.eventPublisher.publish({
            type: 'UserLoggedIn',
            source: 'AuthService',
            payload: { userId: userDTO.id, email: userDTO.email, ip, userAgent }
        });

        return { user: userDTO, accessToken, refreshToken };
    }

    /**
     * Refresh Token
     */
    async refreshToken(token) {
        if (!token) throw new Error('Refresh token is required');
        
        let decoded;
        try {
            decoded = verifyRefreshToken(token);
        } catch (err) {
            throw new Error('Invalid or expired refresh token');
        }

        const user = await this.userRepo.findById(decoded.id);
        if (!user) {
            throw new Error('User not found');
        }

        const tokenPayload = { id: user.id, role: user.role };
        const newAccessToken = generateToken(tokenPayload);
        const newRefreshToken = generateRefreshToken(tokenPayload);

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }

    /**
     * Request Password Reset (mock implementation for scope)
     */
    async requestPasswordReset(email) {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await this.userRepo.findOne({ email: normalizedEmail });
        if (!user) return; // Fail silently to prevent email enumeration

        await this.eventPublisher.publish({
            type: 'PasswordResetRequested',
            source: 'AuthService',
            payload: { userId: user.id, email: user.email }
        });

        // Normally we'd generate a reset token and store it
    }

    /**
     * Reset Password
     */
    async resetPassword(email, newPassword) {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await this.userRepo.findOne({ email: normalizedEmail });
        if (!user) throw new Error('User not found');

        const hashedPassword = await this.hashPassword(newPassword);
        await this.userRepo.update({ id: user.id, password: hashedPassword });

        await this.eventPublisher.publish({
            type: 'PasswordChanged',
            source: 'AuthService',
            payload: { userId: user.id, email: user.email }
        });
        
        return true;
    }

    /**
     * Update Profile
     */
    async updateProfile(userId, updates) {
        const allowedUpdates = { id: userId };
        if (updates.fullName !== undefined) allowedUpdates.fullName = updates.fullName;
        if (updates.country !== undefined) allowedUpdates.country = updates.country;

        const updatedUser = await this.userRepo.update(allowedUpdates);
        return {
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            fullName: updatedUser.fullName,
            country: updatedUser.country
        };
    }

    /**
     * Logout
     */
    async logout(userId) {
        // Publish event
        await this.eventPublisher.publish({
            type: 'UserLoggedOut',
            source: 'AuthService',
            payload: { userId }
        });
        return true;
    }
}

module.exports = AuthService;
