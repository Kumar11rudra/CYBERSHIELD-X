const AuthController = require('../controllers/authController');
const AuthService = require('./auth/AuthService');
const UserRepository = require('./auth/UserRepository');
const RoleRepository = require('./auth/RoleRepository');
const PermissionRepository = require('./auth/PermissionRepository');
const RoleService = require('./auth/RoleService');
const AuthorizationService = require('./auth/AuthorizationService');
const UserService = require('./auth/UserService');
const OrganizationRepository = require('./auth/OrganizationRepository');
const TeamRepository = require('./auth/TeamRepository');
const MembershipRepository = require('./auth/MembershipRepository');
const OrganizationService = require('./auth/OrganizationService');
const TeamService = require('./auth/TeamService');
const MembershipService = require('./auth/MembershipService');

/**
 * Wiring root for Authentication and Authorization module.
 */
function createAuthModule(storageManager, eventPublisher, activeStorageProvider, permissionManager, deps = {}) {
    // 1. Create Repositories
    const userRepo = new UserRepository({ storageProvider: activeStorageProvider });
    const roleRepo = new RoleRepository({ storageProvider: activeStorageProvider });
    const permissionRepo = new PermissionRepository({ storageProvider: activeStorageProvider });
    const orgRepo = new OrganizationRepository({ storageProvider: activeStorageProvider });
    const teamRepo = new TeamRepository({ storageProvider: activeStorageProvider });
    const membershipRepo = new MembershipRepository({ storageProvider: activeStorageProvider });

    // 2. Create Services
    const authService = new AuthService({
        userRepo,
        eventPublisher
    });

    const userService = new UserService({
        userRepo,
        eventPublisher
    });

    const roleService = new RoleService({
        roleRepo,
        permissionRepo,
        eventPublisher
    });

    const authorizationService = new AuthorizationService({
        roleService,
        permissionManager,
        eventPublisher
    });

    const CapabilityAuthorizationService = require('./runtime/CapabilityAuthorizationService');
    const capabilityAuthorizationService = new CapabilityAuthorizationService({
        authorizationService,
        capabilityResolver: deps.capabilityResolver,
        eventPublisher
    });

    const orgService = new OrganizationService({
        orgRepo,
        eventPublisher
    });

    const teamService = new TeamService({
        teamRepo,
        membershipRepo,
        eventPublisher
    });

    const membershipService = new MembershipService({
        membershipRepo,
        userRepo,
        eventPublisher
    });

    // 3. Create Controller
    const authController = new AuthController({
        authService,
        roleService
    });

    return { 
        authController, authService, userService, userRepo, 
        roleService, authorizationService, capabilityAuthorizationService,
        orgService, teamService, membershipService,
        orgRepo, teamRepo, membershipRepo
    };
}

// Optional caching for middleware consumption to avoid cyclic imports
let cachedModule = null;

function getAuthModule(deps = {}) {
    if (!cachedModule) {
        if (!deps.activeStorageProvider) throw new Error('Cannot initialize AuthModule without dependencies');
        cachedModule = createAuthModule(deps.storageManager, deps.eventPublisher, deps.activeStorageProvider, deps.permissionManager, { capabilityResolver: deps.capabilityResolver });
    }
    return cachedModule;
}

module.exports = { createAuthModule, getAuthModule };
