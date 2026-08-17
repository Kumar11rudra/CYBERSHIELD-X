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
     * Register a new user (Pending Verification)
     */
    async register({ username, email, password, mobileNumber, fullName, age, country, gender }) {
        if (!username || !email || !password || !mobileNumber) {
            throw new Error('Username, email, password, and mobile number are required');
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const normalizedUsername = String(username).toLowerCase().trim();
        
        // 1. Check duplicate username, email, and mobile number (Generic response to prevent enumeration)
        // Use emailHash for lookup since email field is encrypted at rest with random IV
        const emailHashCheck = crypto.createHash('sha256').update(normalizedEmail).digest('hex');
        const existingEmail = await this.userRepo.findOne({ emailHash: emailHashCheck });
        if (existingEmail) {
            throw new Error('Username, email, or mobile number is already registered.');
        }

        const existingUsername = await this.userRepo.findOne({ username: normalizedUsername });
        if (existingUsername) {
            throw new Error('Username, email, or mobile number is already registered.');
        }

        const digits = String(mobileNumber).replace(/\D/g, '');
        if (!digits) {
            throw new Error('Invalid mobile number.');
        }

        const mobileHash = crypto.createHash('sha256').update(digits).digest('hex');
        const existingMobile = await this.userRepo.findOne({ mobileHash });
        if (existingMobile) {
            throw new Error('Username, email, or mobile number is already registered.');
        }

        const hashedPassword = await this.hashPassword(password);
        const emailHash = crypto.createHash('sha256').update(normalizedEmail).digest('hex');
        const userId = crypto.randomBytes(12).toString('hex');
        
        const userData = {
            id: userId,
            _id: userId,
            username: normalizedUsername,
            email: normalizedEmail,
            emailHash,
            mobileHash,
            password: hashedPassword,
            role: 'user', // default role
            emailVerified: true,  // immediately active
            status: 'active',     // immediately active
            mobileNumber: mobileNumber.trim(),
            fullName,
            age: age ? Number(age) : undefined,
            country,
            gender,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const savedUser = await this.userRepo.create(userData);

        // Omit password from result DTO
        const userDTO = { 
            id: savedUser.id || savedUser._id || userData.id, 
            username: savedUser.username || userData.username, 
            email: savedUser.email || userData.email, 
            role: savedUser.role || userData.role,
            fullName: savedUser.fullName || userData.fullName,
            mobileNumber: savedUser.mobileNumber || userData.mobileNumber,
            status: savedUser.status || userData.status,
            age: savedUser.age || userData.age,
            country: savedUser.country || userData.country,
            gender: savedUser.gender || userData.gender
        };

        // Publish event
        await this.eventPublisher.publish({
            type: 'UserRegisteredActive',
            source: 'AuthService',
            payload: { userId: userDTO.id, email: userDTO.email }
        });

        return userDTO;
    }

    /**
     * Login user
     */
    async login({ email, identity, password, ip, userAgent }) {
        const loginIdentifier = String(email || identity || '').toLowerCase().trim();
        if (!loginIdentifier || !password) {
            throw new Error('Email or Username and password are required');
        }

        // 1. Lookup by SHA-256 emailHash
        const emailHash = crypto.createHash('sha256').update(loginIdentifier).digest('hex');
        let user = await this.userRepo.findOne({ emailHash });

        // 2. Fallback: Lookup by username
        if (!user) {
            user = await this.userRepo.findOne({ username: loginIdentifier });
        }

        if (!user) {
            await this.eventPublisher.publish({
                type: 'UserLoginFailed',
                source: 'AuthService',
                payload: { identifier: loginIdentifier, reason: 'User not found', ip }
            });
            throw new Error('Invalid credentials');
        }

        // Account status validations
        if (user.status === 'suspended') {
            throw new Error('Account has been suspended. Please contact support.');
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
        const tokenPayload = { id: user.id, role: user.role };
        const accessToken = generateToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        await this.userRepo.update({ id: user.id, lastLoginAt: new Date() });

        const userDTO = { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status };

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
