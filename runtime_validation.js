const path = require('path');
const fs = require('fs');

const baseDir = '/Users/anil/Documents/New project/cybershield-x/server';
const platformComposition = require(path.join(baseDir, 'composition/platformComposition.js'));

// Patch the vault asset repository to avoid mongoose connection timeout
platformComposition.vaultAssetRepository.create = async (data) => {
    return { ...data, _id: 'mock_asset_id', id: 'mock_asset_id' };
};
platformComposition.vaultAssetRepository.find = async () => [];
platformComposition.vaultAssetRepository.findOne = async () => ({ _id: 'mock_asset_id', isLocked: false });
platformComposition.vaultAssetRepository.update = async (id, data) => ({ _id: id, id, ...data });
platformComposition.vaultAssetRepository.delete = async () => true;

const dashboardController = require(path.join(baseDir, 'controllers/dashboardController.js'));
const vaultController = require(path.join(baseDir, 'controllers/vaultController.js'));
const breachController = require(path.join(baseDir, 'controllers/breachController.js'));

let passes = 0;
let fails = 0;

function createMockReq(data = {}) {
    return {
        user: { _id: '507f1f77bcf86cd799439011', organizationId: '507f1f77bcf86cd799439012' },
        body: data.body || {},
        params: data.params || {},
        query: data.query || {}
    };
}

async function testControllerEndpoint(name, controllerFn, reqData = {}, expectedStatus = 200, expectError = false) {
    try {
        const req = createMockReq(reqData);
        let returnedStatus = 200;
        const resData = await new Promise((resolve, reject) => {
            const res = {
                json: (data) => resolve(data),
                status: (code) => {
                    returnedStatus = code;
                    return {
                        json: (data) => resolve(data) // don't reject on 4xx so we can assert the error schema
                    };
                },
                setHeader: () => {}
            };
            controllerFn(req, res).catch(reject);
        });

        if (returnedStatus !== expectedStatus) {
            console.error(`[FAIL] ${name}: Expected status ${expectedStatus} but got ${returnedStatus}`);
            fails++;
            return null;
        }

        if (expectError && !resData.error) {
            console.error(`[FAIL] ${name}: Expected error schema but got success`);
            fails++;
            return null;
        }

        console.log(`[PASS] ${name} (Status: ${returnedStatus})`);
        passes++;
        return resData;
    } catch (err) {
        console.error(`[FAIL] ${name}: Crashed with ${err.message}`);
        fails++;
        return null;
    }
}

async function runRuntimeValidation() {
    console.log("=== Phase 6: Runtime E2E Validation ===");

    // Test Dashboard
    await testControllerEndpoint('Dashboard: getStats', dashboardController.getStats);

    // Test Vault
    const asset = await testControllerEndpoint('Vault: addAsset', vaultController.addAsset, {
        body: { type: 'key', label: 'AWS API Key', value: 'AKIAIOSFODNN7EXAMPLE' }
    });
    if (asset) {
        await testControllerEndpoint('Vault: getAssets', vaultController.getAssets);
        await testControllerEndpoint('Vault: toggleLockdown', vaultController.toggleLockdown, { params: { id: asset.id || 'mock_asset' } });
        await testControllerEndpoint('Vault: deleteAsset', vaultController.deleteAsset, { params: { id: asset.id || 'mock_asset' } });
    }

    // Test Breach
    await testControllerEndpoint('Breach: checkEmail', breachController.checkEmail, { params: { email: 'test@example.com' } });
    await testControllerEndpoint('Breach: checkPhone', breachController.checkPhone, { params: { phone: '919876543210' } });
    await testControllerEndpoint('Breach: checkPassword', breachController.checkPassword, { body: { password: 'weakpassword' } });

    console.log("-----------------------------------------");
    console.log(`Total Passed: ${passes}`);
    console.log(`Total Failed: ${fails}`);
    if (fails > 0) process.exit(1);
}

runRuntimeValidation();
