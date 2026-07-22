const WorkflowDefinitionDTO = require('./dto/WorkflowDefinitionDTO');
const WorkflowStageDTO = require('./dto/WorkflowStageDTO');
const WorkflowTemplateDTO = require('./dto/WorkflowTemplateDTO');
const IRepository = require('../../shared/IRepository');

/**
 * @module WorkflowTemplateRepository
 * @description Storage abstraction wrapper for WorkflowTemplates.
 */
class WorkflowTemplateRepository extends IRepository {
    /**
     * @param {Object} deps
     * @param {import('../chatbot_core/storage/IStorageProvider')} deps.storageProvider
     */
    constructor(deps) {
        super();
        if (!deps || !deps.storageProvider) {
            throw new Error('WorkflowTemplateRepository requires storageProvider');
        }
        this.storageProvider = deps.storageProvider;
        this.collectionName = 'workflow_templates';
    }

    /**
     * Seeds default templates into the database idempotently.
     */
    async initialize() {
        const templates = this._getDefaultTemplates();
        
        for (const template of templates) {
            const existing = await this.storageProvider.findById(this.collectionName, template.templateId);
            if (!existing) {
                await this.storageProvider.save(this.collectionName, template.templateId, template);
            } else if (existing.version !== template.version) {
                // Upsert on version change
                await this.storageProvider.update(this.collectionName, template.templateId, template);
            }
        }
    }

    _getDefaultTemplates() {
        return [
            new WorkflowDefinitionDTO({
                templateId: 'tpl-quick-scan',
                name: 'Quick Scan',
                description: 'Fast, non-intrusive scan of common ports and web services.',
                version: '1.0.0', // Ensure version is tracked
                stages: [
                    new WorkflowStageDTO({
                        stageId: 'stage-1-recon',
                        name: 'Reconnaissance',
                        executionMode: 'PARALLEL',
                        executionPolicy: 'CONTINUE_ON_ERROR',
                        steps: [
                            { capabilityId: 'nmap.scan', parameters: { profile: 'fast' } },
                            { capabilityId: 'whatweb.scan' }
                        ]
                    })
                ]
            }),
            new WorkflowDefinitionDTO({
                templateId: 'tpl-full-web',
                name: 'Full Web Application Scan',
                description: 'Comprehensive web vulnerability scanning pipeline.',
                version: '1.0.0',
                stages: [
                    new WorkflowStageDTO({
                        stageId: 'stage-1-recon',
                        name: 'Domain Recon',
                        executionMode: 'PARALLEL',
                        steps: [
                            { capabilityId: 'subfinder.scan' },
                            { capabilityId: 'dnsx.scan' }
                        ]
                    }),
                    new WorkflowStageDTO({
                        stageId: 'stage-2-network',
                        name: 'Network Discovery',
                        executionMode: 'SEQUENTIAL',
                        steps: [
                            { capabilityId: 'nmap.scan', parameters: { profile: 'full' } }
                        ]
                    }),
                    new WorkflowStageDTO({
                        stageId: 'stage-3-vuln',
                        name: 'Vulnerability Scanning',
                        executionMode: 'PARALLEL',
                        steps: [
                            { capabilityId: 'nikto.scan' },
                            { capabilityId: 'trivy.scan' }
                        ]
                    })
                ]
            })
        ];
    }

    /**
     * @param {string} templateId 
     * @returns {Promise<WorkflowDefinitionDTO|null>}
     */
    async findById(templateId) {
        const doc = await this.storageProvider.findById(this.collectionName, templateId);
        if (!doc) return null;
        return new WorkflowDefinitionDTO(doc);
    }

    /**
     * @returns {Promise<Array<WorkflowDefinitionDTO>>}
     */
    async findAll() {
        const docs = await this.storageProvider.findMany(this.collectionName, {});
        return docs.map(doc => new WorkflowDefinitionDTO(doc));
    }
}

module.exports = WorkflowTemplateRepository;
