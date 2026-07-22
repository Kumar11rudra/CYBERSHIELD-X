'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ReportTemplateRegistry {
    constructor() {
        this.templates = new Map();
        this.baseDir = path.resolve(__dirname, '../../templates/reports');
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;

        // Fail-fast if directory doesn't exist
        if (!fs.existsSync(this.baseDir)) {
            throw new Error(`[ReportTemplateRegistry] Base directory not found: ${this.baseDir}`);
        }

        const files = fs.readdirSync(this.baseDir);
        for (const file of files) {
            // Include md, html, json, sarif, stix
            const ext = path.extname(file);
            const templateName = file;
            
            if (this.templates.has(templateName)) {
                throw new Error(`[ReportTemplateRegistry] Duplicate template detected: ${templateName}`);
            }

            const content = fs.readFileSync(path.join(this.baseDir, file), 'utf-8');
            const checksum = crypto.createHash('sha256').update(content).digest('hex');

            this.templates.set(templateName, Object.freeze({
                content,
                checksum,
                version: '1.0'
            }));
        }
        
        this.initialized = true;
    }

    getTemplate(name) {
        if (!this.initialized) {
            throw new Error('[ReportTemplateRegistry] Not initialized');
        }

        const template = this.templates.get(name);
        if (!template) {
            throw new Error(`[ReportTemplateRegistry] Template not found: ${name}`);
        }

        return template;
    }
}

// Singleton
module.exports = new ReportTemplateRegistry();
