'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class PromptRegistry {
    constructor() {
        this.prompts = new Map();
        this.baseDir = path.resolve(__dirname, '../../ai/prompts/csi');
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;

        // Fail-fast if directory doesn't exist
        if (!fs.existsSync(this.baseDir)) {
            throw new Error(`[PromptRegistry] Base directory not found: ${this.baseDir}`);
        }

        const files = fs.readdirSync(this.baseDir);
        for (const file of files) {
            if (file.endsWith('.md')) {
                const promptName = file.replace('.md', '');
                
                if (this.prompts.has(promptName)) {
                    throw new Error(`[PromptRegistry] Duplicate prompt detected: ${promptName}`);
                }

                const content = fs.readFileSync(path.join(this.baseDir, file), 'utf-8');
                const checksum = crypto.createHash('sha256').update(content).digest('hex');

                this.prompts.set(promptName, Object.freeze({
                    content,
                    checksum,
                    version: '1.0'
                }));
            }
        }
        
        this.initialized = true;
    }

    getPrompt(name) {
        if (!this.initialized) {
            throw new Error('[PromptRegistry] Not initialized');
        }

        const prompt = this.prompts.get(name);
        if (!prompt) {
            throw new Error(`[PromptRegistry] Prompt not found: ${name}`);
        }

        return prompt;
    }
}

// Singleton
module.exports = new PromptRegistry();
