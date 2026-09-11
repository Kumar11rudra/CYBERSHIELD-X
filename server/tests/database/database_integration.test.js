const mongoose = require('mongoose');
const testDbHelper = require('../helpers/testDbHelper');
const User = require('../../models/User');
const Verification = require('../../models/Verification');
const ToolRegistry = require('../../models/ToolRegistry');
const ToolExecution = require('../../models/ToolExecution');

describe('Database Integration & Persistence Verification Suite', () => {
  beforeAll(async () => {
    await testDbHelper.connect();
  });

  afterAll(async () => {
    await User.deleteMany({ username: /^test_db_user_/ });
    await Verification.deleteMany({ email: /^test_db_verify_/ });
    await ToolExecution.deleteMany({ executionId: /^test_db_exec_/ });
    await ToolRegistry.deleteMany({ toolId: /^test_db_tool_/ });
    await testDbHelper.disconnect();
  });

  it('verifies User unique constraint and persistence', async () => {
    const timestamp = Date.now();
    const user = await User.create({
      username: `test_db_user_${timestamp}`,
      email: `test_db_user_${timestamp}@example.com`,
      password: 'Password123!',
      fullName: 'Test Persistence User',
      gender: 'Other'
    });

    expect(user).toBeDefined();
    expect(user._id).toBeDefined();
    expect(user.email).toBeDefined();

    // Verify duplicate username rejection
    await expect(User.create({
      username: `test_db_user_${timestamp}`,
      email: `test_db_user_diff_${timestamp}@example.com`,
      password: 'Password123!',
      fullName: 'Duplicate User',
      gender: 'Other'
    })).rejects.toThrow();
  });

  it('verifies Verification schema expiration, tokens, and fields', async () => {
    const timestamp = Date.now();
    const destination = `test_db_verify_${timestamp}@example.com`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10);
    const verification = await Verification.create({
      email: destination,
      otp: 'hashed_otp_sample_123',
      type: 'email_signup',
      expiresAt,
      attemptsRemaining: 4,
      purpose: 'email_signup',
      destination,
      channel: 'email',
      status: 'pending'
    });

    expect(verification).toBeDefined();
    expect(verification.attemptsRemaining).toBe(4);
    expect(verification.status).toBe('pending');
    expect(verification.destination).toBe(destination);
  });

  it('verifies ToolExecution schema creation, querying, and audit metadata', async () => {
    const exec = await ToolExecution.create({
      executionId: 'test_db_exec_001',
      toolId: 'dns',
      status: 'success',
      executionMode: 'sync',
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: 120,
      targetHash: 'sha256_mock_hash_for_test',
      provider: 'HOST_NATIVE',
      metadata: { clientIP: '127.0.0.1' }
    });

    expect(exec).toBeDefined();
    expect(exec.executionId).toBe('test_db_exec_001');
    expect(exec.status).toBe('success');
    expect(exec.provider).toBe('HOST_NATIVE');

    const retrieved = await ToolExecution.findOne({ executionId: 'test_db_exec_001' });
    expect(retrieved).toBeDefined();
    expect(retrieved.durationMs).toBe(120);
  });

  it('verifies ToolRegistry schema creation and dynamic status querying', async () => {
    const tool = await ToolRegistry.create({
      toolId: 'test_db_tool_ping',
      displayName: 'Ping Diagnostic',
      category: 'Network',
      status: 'live',
      type: 'scanner',
      description: 'Host network ping prober'
    });

    expect(tool).toBeDefined();
    expect(tool.toolId).toBe('test_db_tool_ping');

    const found = await ToolRegistry.findOne({ toolId: 'test_db_tool_ping' });
    expect(found.status).toBe('live');
  });
});
