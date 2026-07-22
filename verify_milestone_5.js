const fs = require('fs');
const path = require('path');

const CHECK = '✓';
const FAIL = '❌';

function verify() {
    console.log("=== Running Milestone 5 AI Domain Validations ===\n");

    let allPassed = true;

    // 1. Controller Checks (No Mongoose, No Providers, Thin)
    const controllers = ['aiController.js', 'aiReportController.js'];
    for (const c of controllers) {
        const cPath = path.join(__dirname, 'server/controllers', c);
        if (!fs.existsSync(cPath)) continue;
        const content = fs.readFileSync(cPath, 'utf8');

        // Check mongoose
        if (content.includes("require('../models/") || content.includes("require('mongoose')")) {
            console.log(`${FAIL} ${c} contains direct Mongoose/Model imports.`);
            allPassed = false;
        } else {
            console.log(`${CHECK} ${c} has zero direct Mongoose imports.`);
        }

        // Check providers
        if (content.includes("new OllamaProvider") || content.includes("new GeminiProvider")) {
            console.log(`${FAIL} ${c} instantiates providers directly.`);
            allPassed = false;
        } else {
            console.log(`${CHECK} ${c} abstracts providers correctly.`);
        }
    }

    // 2. Composition Root Check
    const compPath = path.join(__dirname, 'server/composition/aiComposition.js');
    if (fs.existsSync(compPath)) {
        const content = fs.readFileSync(compPath, 'utf8');
        if (content.includes("new OllamaProvider") && content.includes("new AIService")) {
            console.log(`${CHECK} aiComposition.js successfully wires dependencies via DI.`);
        } else {
            console.log(`${FAIL} aiComposition.js is missing critical DI wirings.`);
            allPassed = false;
        }
    } else {
        console.log(`${FAIL} aiComposition.js not found.`);
        allPassed = false;
    }

    // 3. DTO Immutability
    const dtos = ['AIAnalysisDTO.js', 'AIReportDTO.js'];
    for (const d of dtos) {
        const dPath = path.join(__dirname, 'server/models/dto', d);
        if (!fs.existsSync(dPath)) continue;
        const content = fs.readFileSync(dPath, 'utf8');
        if (content.includes("Object.freeze(this)")) {
            console.log(`${CHECK} ${d} enforces immutability (Object.freeze).`);
        } else {
            console.log(`${FAIL} ${d} missing Object.freeze(this).`);
            allPassed = false;
        }
    }

    // 4. Provider Abstraction
    const providerPath = path.join(__dirname, 'server/providers/ai/IAIProvider.js');
    if (fs.existsSync(providerPath)) {
        console.log(`${CHECK} IAIProvider abstraction layer exists.`);
    } else {
        console.log(`${FAIL} IAIProvider missing.`);
        allPassed = false;
    }

    if (allPassed) {
        console.log(`\n${CHECK} All validations PASSED. Ready for Milestone 5 Phase 2 Closeout.`);
    } else {
        console.log(`\n${FAIL} Validations FAILED.`);
        process.exit(1);
    }
}

verify();
