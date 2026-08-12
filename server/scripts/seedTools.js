const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('../utils/database');
const ToolRegistry = require('../models/ToolRegistry');

// Transpile ESM toolConfig.js to CommonJS dynamically
const esmPath = path.resolve(__dirname, '../../client/src/components/toolkit/toolConfig.js');
const tmpCjsPath = path.resolve(__dirname, 'toolConfig.cjs');

const content = fs.readFileSync(esmPath, 'utf8');
const cjsContent = content
  .replace(/export const TOOL_TYPES =/g, 'const TOOL_TYPES =')
  .replace(/export const TOOL_STATUS =/g, 'const TOOL_STATUS =')
  .replace(/export const INPUT_TYPES =/g, 'const INPUT_TYPES =')
  .replace(/export const CATEGORIES =/g, 'const CATEGORIES =')
  .replace(/export const CATEGORY_METADATA =/g, 'const CATEGORY_METADATA =')
  .replace(/export const getToolConfig =/g, 'const getToolConfig =')
  .replace(/export const getAllTools =/g, 'const getAllTools =')
  .replace(/export const getToolsByStatus =/g, 'const getToolsByStatus =')
  .replace(/export const getToolsByCategory =/g, 'const getToolsByCategory =')
  .replace(/export const getToolsByType =/g, 'const getToolsByType =')
  .replace(/export const getAllCategories =/g, 'const getAllCategories =')
  .replace(/export const isToolActive =/g, 'const isToolActive =')
  .replace(/export const getStatusBadge =/g, 'const getStatusBadge =')
  .replace(/export default TOOL_CONFIG;/g, '')
  + '\nmodule.exports = { TOOL_CONFIG, TOOL_STATUS, CATEGORIES };';

fs.writeFileSync(tmpCjsPath, cjsContent, 'utf8');

// Load configurations
const { TOOL_CONFIG, TOOL_STATUS, CATEGORIES } = require('./toolConfig.cjs');

const runSeed = async () => {
  try {
    const toolsList = Object.values(TOOL_CONFIG);
    console.log(`Authoritative catalog contains ${toolsList.length} tools.`);

    // Connect to database
    await connectDB();

    console.log('Synchronizing catalog to database registry...');

    let inserted = 0;
    let updated = 0;

    for (const t of toolsList) {
      const existing = await ToolRegistry.findOne({ toolId: t.id });

      const updateData = {
        displayName: t.name,
        description: t.description || t.tagline || '',
        category: t.category,
        status: t.status,
        backendTarget: t.backendTarget || null,
        permissionLevel: t.permissionLevel || 'GUEST',
        sandboxRequired: t.sandboxRequired || false,
        providerDependency: t.providerDependency || null,
        executionMode: t.executionMode || 'sync',
        version: t.version || '1.0.0',
        metadata: {
          tagline: t.tagline || '',
          icon: t.icon || '🔧',
          color: t.color || '#3b82f6',
          capabilities: t.capabilities || [],
          roadmapDescription: t.roadmapDescription || '',
          roadmapPhase: t.roadmapPhase || '',
          databaseDependency: t.databaseDependency || false,
          configRequiredMessage: t.configRequiredMessage || ''
        }
      };

      if (existing) {
        await ToolRegistry.updateOne({ toolId: t.id }, updateData);
        updated++;
      } else {
        await ToolRegistry.create({
          toolId: t.id,
          enabled: true,
          ...updateData
        });
        inserted++;
      }
    }

    console.log('\nReconciliation completed:');
    console.log(`  - Total processed: ${toolsList.length}`);
    console.log(`  - Newly inserted: ${inserted}`);
    console.log(`  - Updated existing: ${updated}`);

    // Verify final DB counts
    const dbTotal = await ToolRegistry.countDocuments();
    const dbLive = await ToolRegistry.countDocuments({ status: TOOL_STATUS.LIVE });
    const dbPartial = await ToolRegistry.countDocuments({ status: TOOL_STATUS.PARTIAL });
    const dbComingSoon = await ToolRegistry.countDocuments({ status: TOOL_STATUS.COMING_SOON });
    const dbDisabled = await ToolRegistry.countDocuments({ enabled: false });

    console.log(`\nRegistry Database Counts:`);
    console.log(`  - Total: ${dbTotal}`);
    console.log(`  - LIVE: ${dbLive}`);
    console.log(`  - PARTIAL: ${dbPartial}`);
    console.log(`  - COMING SOON: ${dbComingSoon}`);
    console.log(`  - DISABLED: ${dbDisabled}`);

  } catch (err) {
    console.error('Failed to seed tools registry:', err);
  } finally {
    // Cleanup transpiled config file
    try {
      fs.unlinkSync(tmpCjsPath);
    } catch {}
    // Close DB connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

runSeed();
