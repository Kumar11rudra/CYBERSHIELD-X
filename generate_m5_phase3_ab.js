const fs = require('fs');
const path = require('path');

const baseDir = '/Users/anil/Documents/New project/cybershield-x/server';
const repoDir = path.join(baseDir, 'repositories');
const dtoDir = path.join(baseDir, 'models', 'dto');

const entities = [
  'ActivityLog',
  'IntegrationConfig',
  'Notification',
  'Playbook',
  'AutomationRun',
  'CommunityNote',
  'VaultAsset',
  'Watchlist',
  'SystemSettings',
  'OrganizationSettings'
];

entities.forEach(entity => {
  const repoContent = `const ${entity} = require('../models/${entity}');
const ${entity}DTO = require('../models/dto/${entity}DTO');

class ${entity}Repository {
    async findById(id) {
        const doc = await ${entity}.findById(id);
        if (!doc) return null;
        return new ${entity}DTO(doc.toObject());
    }

    async find(filter = {}) {
        const docs = await ${entity}.find(filter);
        return docs.map(doc => new ${entity}DTO(doc.toObject()));
    }

    async findOne(filter = {}) {
        const doc = await ${entity}.findOne(filter);
        if (!doc) return null;
        return new ${entity}DTO(doc.toObject());
    }

    async create(data) {
        const doc = await ${entity}.create(data);
        return new ${entity}DTO(doc.toObject());
    }

    async update(id, data) {
        const doc = await ${entity}.findByIdAndUpdate(id, data, { new: true });
        if (!doc) return null;
        return new ${entity}DTO(doc.toObject());
    }

    async delete(id) {
        const doc = await ${entity}.findByIdAndDelete(id);
        if (!doc) return null;
        return new ${entity}DTO(doc.toObject());
    }
}

module.exports = ${entity}Repository;
`;
  
  fs.writeFileSync(path.join(repoDir, `${entity}Repository.js`), repoContent);

  const dtoContent = `class ${entity}DTO {
    constructor(data) {
        Object.assign(this, data);
        if (this._id) {
            this.id = this._id.toString();
            delete this._id;
        }
        delete this.__v;
        Object.freeze(this);
    }
}

module.exports = ${entity}DTO;
`;

  fs.writeFileSync(path.join(dtoDir, `${entity}DTO.js`), dtoContent);
});

// Extra DTOs requested by Architecture Lead
const extraDTOs = ['AnalyticsDTO', 'DashboardStatsDTO', 'DashboardRecommendationDTO', 'ReportDTO'];
extraDTOs.forEach(dto => {
  const dtoContent = `class ${dto} {
    constructor(data) {
        Object.assign(this, data);
        Object.freeze(this);
    }
}

module.exports = ${dto};
`;
  fs.writeFileSync(path.join(dtoDir, `${dto}.js`), dtoContent);
});

// Platform Errors
const errorsContent = `class PlatformError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

class DashboardError extends PlatformError {
  constructor(message) {
    super(message, 500);
  }
}

class VaultError extends PlatformError {
  constructor(message) {
    super(message, 400);
  }
}

class ReportGenerationError extends PlatformError {
  constructor(message) {
    super(message, 500);
  }
}

class BreachProviderError extends PlatformError {
  constructor(message) {
    super(message, 502);
  }
}

class AnalyticsError extends PlatformError {
  constructor(message) {
    super(message, 500);
  }
}

module.exports = {
  PlatformError,
  DashboardError,
  VaultError,
  ReportGenerationError,
  BreachProviderError,
  AnalyticsError
};
`;
fs.writeFileSync(path.join(baseDir, 'utils', 'PlatformErrors.js'), errorsContent);

console.log("Phase A & Phase B files generated successfully.");
