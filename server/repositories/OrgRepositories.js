const Organization = require('../models/Organization');
const Membership = require('../models/Membership');
const Team = require('../models/Team');
const Webhook = require('../models/Webhook');
const Invitation = require('../models/Invitation');

class OrganizationRepository {
    async create(data) { return Organization.create(data); }
    async findById(id) { return Organization.findById(id); }
    async find(query) { return Organization.find(query); }
    async update(id, data) { return Organization.findByIdAndUpdate(id, data, { new: true }); }
}

class MembershipRepository {
    async create(data) { return Membership.create(data); }
    async findOne(query) { return Membership.findOne(query); }
    async find(query) { return Membership.find(query); }
    async update(query, data) { return Membership.findOneAndUpdate(query, data, { new: true }); }
    async delete(query) { return Membership.findOneAndDelete(query); }
    async count(query) { return Membership.countDocuments(query); }
}

class TeamRepository {
    async create(data) { return Team.create(data); }
    async findById(id) { return Team.findById(id); }
    async find(query, skip = 0, limit = 1000) { 
        return Team.find(query).skip(skip).limit(limit); 
    }
    async update(id, data) { return Team.findByIdAndUpdate(id, data, { new: true }); }
    async count(query) { return Team.countDocuments(query); }
}

class WebhookRepository {
    async create(data) { return Webhook.create(data); }
    async findById(id) { return Webhook.findById(id); }
    async find(query, skip = 0, limit = 1000) { 
        return Webhook.find(query).skip(skip).limit(limit); 
    }
    async update(id, data) { return Webhook.findByIdAndUpdate(id, data, { new: true }); }
    async delete(id) { return Webhook.findByIdAndDelete(id); }
    async count(query) { return Webhook.countDocuments(query); }
}

class InvitationRepository {
    async create(data) { return Invitation.create(data); }
    async findOne(query) { return Invitation.findOne(query); }
    async find(query) { return Invitation.find(query); }
    async update(id, data) { return Invitation.findByIdAndUpdate(id, data, { new: true }); }
}

module.exports = {
    organizationRepository: new OrganizationRepository(),
    membershipRepository: new MembershipRepository(),
    teamRepository: new TeamRepository(),
    webhookRepository: new WebhookRepository(),
    invitationRepository: new InvitationRepository()
};
