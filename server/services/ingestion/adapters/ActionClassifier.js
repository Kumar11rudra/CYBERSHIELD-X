/**
 * 🛡️ CyberShield X — ActionClassifier (Phase 80 Step 4)
 *
 * Deterministic, Provider-Neutral 5-Tier Operation Classifier:
 * - Tier 1: High-Signal Mutating (IAM policy, security group, bucket ACL, firewall, route table)
 * - Tier 2: High-Signal Security (Console/CLI Logins, AssumeRole, secret access, MFA, API keys)
 * - Tier 3: Medium-Signal Lifecycle (VM/container lifecycle, cluster scaling, snapshot create/delete)
 * - Tier 4: High-Frequency Read/List (Describe*, List*, Get*, Head*, BatchGet*, Search*) -> Telemetry-only
 * - Tier 5: Unknown / Unclassified -> Safe telemetry-only default
 *
 * Implements Section 3 & ADR 80-09 of PHASE_80_PRE_IMPLEMENTATION_ARCHITECTURE_SECURITY_AUDIT.md.
 * Strictly deterministic: Zero AI/LLM inference.
 */

'use strict';

// -----------------------------------------------------------------------------
// Action Tier Classification Rules
// -----------------------------------------------------------------------------

const AWS_TIER_RULES = [
  // Tier 1: Mutating Security / IAM / Network Configuration
  {
    tier: 1,
    category: 'MUTATING_SECURITY',
    isMutating: true,
    pattern: /^(CreateUser|DeleteUser|UpdateUser|CreateRole|DeleteRole|UpdateRole|AttachUserPolicy|DetachUserPolicy|AttachRolePolicy|DetachRolePolicy|PutUserPolicy|DeleteUserPolicy|PutRolePolicy|DeleteRolePolicy|CreatePolicy|DeletePolicy|CreatePolicyVersion|SetDefaultPolicyVersion|AuthorizeSecurityGroupIngress|AuthorizeSecurityGroupEgress|RevokeSecurityGroupIngress|RevokeSecurityGroupEgress|CreateSecurityGroup|DeleteSecurityGroup|PutBucketAcl|PutBucketPolicy|DeleteBucketPolicy|PutBucketCors|PutBucketEncryption|CreateRoute|DeleteRoute|ReplaceRoute|CreateVpc|DeleteVpc|CreateSubnet|DeleteSubnet|CreateNetworkAcl|DeleteNetworkAcl|CreateNetworkAclEntry|ReplaceNetworkAclEntry|DeleteNetworkAclEntry|CreateFirewall|DeleteFirewall|UpdateFirewallPolicy|PutGroupPolicy|AttachGroupPolicy)$/i,
  },
  // Tier 2: High-Signal Security & Authentication
  {
    tier: 2,
    category: 'SECURITY_AUTH',
    isMutating: false,
    pattern: /^(ConsoleLogin|AssumeRole|AssumeRoleWithSAML|AssumeRoleWithWebIdentity|GetSessionToken|GetFederationToken|ChangePassword|CreateAccessKey|DeleteAccessKey|UpdateAccessKey|CreateLoginProfile|UpdateLoginProfile|DeleteLoginProfile|EnableMFADevice|DeactivateMFADevice|ResyncMFADevice|GetSecretValue|GetPasswordData|Decrypt)$/i,
  },
  // Tier 3: Medium-Signal Lifecycle Operations
  {
    tier: 3,
    category: 'LIFECYCLE',
    isMutating: true,
    pattern: /^(RunInstances|TerminateInstances|StartInstances|StopInstances|RebootInstances|ModifyInstanceAttribute|CreateSnapshot|DeleteSnapshot|CreateVolume|DeleteVolume|AttachVolume|DetachVolume|CreateCluster|DeleteCluster|UpdateClusterConfig|CreateDBInstance|DeleteDBInstance|RebootDBInstance|CreateDBCluster|DeleteDBCluster)$/i,
  },
  // Tier 4: High-Frequency Read/List/Describe
  {
    tier: 4,
    category: 'READ_LIST',
    isMutating: false,
    pattern: /^(Describe|List|Get|BatchGet|Head|Check|Search|Lookup|Filter).+/i,
  },
];

const GCP_TIER_RULES = [
  // Tier 1: Mutating IAM / Security / Network
  {
    tier: 1,
    category: 'MUTATING_SECURITY',
    isMutating: true,
    pattern: /(SetIamPolicy|createServiceAccount|deleteServiceAccount|updateServiceAccount|createRole|deleteRole|updateRole|createFirewall|deleteFirewall|patchFirewall|updateFirewall|setCommonInstanceMetadata|setMetadata|setTags|v1\.compute\.securityPolicies\.(insert|delete|patch)|v1\.compute\.firewalls\.(insert|delete|patch|update)|storage\.buckets\.(setIamPolicy|update|patch|delete))/i,
  },
  // Tier 2: High-Signal Security & Authentication
  {
    tier: 2,
    category: 'SECURITY_AUTH',
    isMutating: false,
    pattern: /(loginStatus|SignIn|SignOut|createServiceAccountKey|deleteServiceAccountKey|accessSecretVersion|getSecretVersion|generateAccessToken|generateIdToken|signBlob|signJwt)/i,
  },
  // Tier 3: Medium-Signal Lifecycle
  {
    tier: 3,
    category: 'LIFECYCLE',
    isMutating: true,
    pattern: /(v1\.compute\.instances\.(insert|delete|start|stop|reset)|v1\.compute\.disks\.(insert|delete|createSnapshot)|v1\.compute\.snapshots\.delete|google\.container\.v1\.ClusterManager\.(CreateCluster|DeleteCluster|UpdateCluster)|cloudsql\.instances\.(create|delete|restart))/i,
  },
  // Tier 4: High-Frequency Read/List
  {
    tier: 4,
    category: 'READ_LIST',
    isMutating: false,
    pattern: /((\.get|\.list|\.aggregatedList|\.testIamPermissions)$|^(get|list|search|read|batchGet))/i,
  },
];

const AZURE_TIER_RULES = [
  // Tier 1: Mutating Security / Role Assignments / NSG / Firewall
  {
    tier: 1,
    category: 'MUTATING_SECURITY',
    isMutating: true,
    pattern: /(Microsoft\.Authorization\/roleAssignments\/write|Microsoft\.Authorization\/roleAssignments\/delete|Microsoft\.Authorization\/roleDefinitions\/write|Microsoft\.Authorization\/roleDefinitions\/delete|Microsoft\.Network\/networkSecurityGroups\/write|Microsoft\.Network\/networkSecurityGroups\/delete|Microsoft\.Network\/networkSecurityGroups\/securityRules\/write|Microsoft\.Network\/networkSecurityGroups\/securityRules\/delete|Microsoft\.Network\/azureFirewalls\/write|Microsoft\.Network\/azureFirewalls\/delete|Microsoft\.KeyVault\/vaults\/accessPolicies\/write)/i,
  },
  // Tier 2: High-Signal Security & Authentication
  {
    tier: 2,
    category: 'SECURITY_AUTH',
    isMutating: false,
    pattern: /(Microsoft\.Storage\/storageAccounts\/listKeys\/action|Microsoft\.KeyVault\/vaults\/secrets\/read|Microsoft\.DocumentDB\/databaseAccounts\/listKeys\/action|Microsoft\.Web\/sites\/publishxml\/action|Microsoft\.Web\/sites\/config\/list\/action|signin|login)/i,
  },
  // Tier 3: Medium-Signal Lifecycle Operations
  {
    tier: 3,
    category: 'LIFECYCLE',
    isMutating: true,
    pattern: /(Microsoft\.Compute\/virtualMachines\/(write|delete|start\/action|restart\/action|deallocate\/action)|Microsoft\.Compute\/disks\/(write|delete)|Microsoft\.ContainerService\/managedClusters\/(write|delete)|Microsoft\.Sql\/servers\/databases\/(write|delete))/i,
  },
  // Tier 4: High-Frequency Read/List
  {
    tier: 4,
    category: 'READ_LIST',
    isMutating: false,
    pattern: /(\/read$|\/action$|Microsoft\.Compute\/virtualMachines\/read|Microsoft\.Resources\/subscriptions\/resourceGroups\/read)/i,
  },
];

class ActionClassifier {
  /**
   * Deterministically classify an operation into a 5-tier classification.
   *
   * @param {string} provider - 'AWS' | 'GCP' | 'AZURE'
   * @param {string} operationName - Provider native operation name (e.g., 'CreateUser')
   * @param {Object} [overrides={}] - Optional administrator connector rule overrides
   * @returns {{ tier: number, category: string, isMutating: boolean }}
   */
  static classify(provider, operationName, overrides = {}) {
    if (!operationName || typeof operationName !== 'string') {
      return { tier: 5, category: 'UNKNOWN', isMutating: false };
    }

    const trimmedOp = operationName.trim();

    // 1. Check for explicit connector overrides (e.g. elevating GetSecretValue to Tier 2)
    if (overrides && typeof overrides === 'object' && overrides[trimmedOp]) {
      const override = overrides[trimmedOp];
      return {
        tier: Number(override.tier) || 5,
        category: override.category || 'CUSTOM_OVERRIDE',
        isMutating: Boolean(override.isMutating),
      };
    }

    // 2. Select ruleset by provider
    let rules = [];
    const normalizedProvider = String(provider).toUpperCase();
    if (normalizedProvider === 'AWS') {
      rules = AWS_TIER_RULES;
    } else if (normalizedProvider === 'GCP') {
      rules = GCP_TIER_RULES;
    } else if (normalizedProvider === 'AZURE') {
      rules = AZURE_TIER_RULES;
    } else {
      return { tier: 5, category: 'UNKNOWN_PROVIDER', isMutating: false };
    }

    // 3. Match against deterministic rules
    for (const rule of rules) {
      if (rule.pattern.test(trimmedOp)) {
        return {
          tier: rule.tier,
          category: rule.category,
          isMutating: rule.isMutating,
        };
      }
    }

    // 4. Default fallback: Tier 5 (Unknown / Unclassified)
    return {
      tier: 5,
      category: 'UNCLASSIFIED',
      isMutating: false,
    };
  }
}

module.exports = ActionClassifier;
