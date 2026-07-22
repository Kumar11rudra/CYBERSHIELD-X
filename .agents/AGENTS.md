# CyberShield X - Agent Customizations & Project Rules

## Project State Documentation Rule

This is a permanent project rule for CyberShield X:

1. **Single Source of Truth**: The `PROJECT_STATE.md` file located at the root of the project is the single source of truth for the entire project.
2. **Mandatory Updates**: At the end of EVERY implementation phase and EVERY audit, `PROJECT_STATE.md` MUST be automatically updated.
3. **Mandatory Pre-read**: Before starting ANY new implementation or audit, you MUST ALWAYS read:
   - `PROJECT_STATE.md`
   - `task.md` (Artifact)
   - `implementation_plan.md` (Artifact)
   - `walkthrough.md` (Artifact)
4. **Validation**: Compare the current project against these documents. Never recreate features that already exist. Only extend or improve existing architecture. If documentation and implementation differ, report the mismatch before making changes.

When updating `PROJECT_STATE.md`, ensure it contains at minimum:
* Current Project Version
* Current AI Version
* Completed Phases
* Pending Phases
* Existing Modules
* Active Architecture
* APIs Integrated
* Tool Registry Status
* Current Services
* Current Controllers
* Current Routes
* Current Frontend Components
* Current Backend Components
* Current Database Status
* Current Security Features
* Current AI Capabilities
* Current Limitations
* Known Issues
* Technical Debt
* Future Roadmap
* Last Audit Date
* Last Modified Date

## Project Synchronization Report Rule

**CRITICAL MANDATORY WORKFLOW**: Do not rely on assumptions. At the beginning of EVERY new implementation phase or audit:
1. You MUST explicitly verify that you have read and synchronized:
   - `PROJECT_STATE.md`
   - `task.md` (Artifact)
   - `implementation_plan.md` (Artifact)
   - `walkthrough.md` (Artifact)
2. **Before writing any code**, you MUST generate a short "Project Synchronization Report" in your response containing:
   * Current Project Version
   * Completed Phases
   * Current Architecture
   * Existing Modules
   * Planned Phase
   * Documentation Status
   * Any mismatches found
3. If documentation and implementation differ, STOP and report the mismatch before making changes.
4. Only continue with coding when synchronization is complete and approved if mismatches were found.

## Scope Analysis Report Rule

**CRITICAL MANDATORY WORKFLOW**: Before every implementation phase, you MUST determine the isolated scope of the current phase.
1. **DO NOT** scan or read the entire project unless explicitly requested.
2. Identify the affected modules first. Read ONLY:
   - Shared documentation (`PROJECT_STATE.md`, etc.)
   - Dependencies & Related modules
   - Files affected by the current phase
3. **Generate a "Scope Analysis Report"** before implementation (can be combined with the Synchronization Report or presented alongside it). The report MUST include:
   * Current Phase
   * Modules Affected
   * Files to Read
   * Files to Modify
   * Files Not Affected
   * Estimated Risk
   * Dependency Impact
4. **Never modify unrelated modules.** Keep every phase isolated as much as possible.

These rules are permanent for the lifetime of the project.

## Permanent Project Rule — Definition of Done (DoD)

From now on, NO implementation phase is considered complete simply because the code has been written.

Every phase MUST successfully pass the following reviews before it can be marked as completed.

### Mandatory Review Pipeline

1. **Architecture Review**
    * Verify architecture follows the approved design.
    * Verify layering rules are respected.
    * Verify dependency boundaries are maintained.
    * Verify no unnecessary coupling has been introduced.
2. **Code Review**
    * Verify coding standards.
    * Verify SOLID principles.
    * Verify Dependency Injection.
    * Verify naming conventions.
    * Verify error handling.
    * Verify maintainability.
3. **Integration Review**
    * Verify interfaces.
    * Verify constructors.
    * Verify dependency injection chain.
    * Verify compatibility with existing modules.
    * Verify no runtime conflicts.
4. **Security Review**
    * Verify least-privilege design.
    * Verify no sensitive data exposure.
    * Verify authentication and authorization boundaries.
    * Verify trust and safety compliance.
    * Verify secure defaults.
5. **Documentation Review**
    * Verify all documentation is synchronized.
    * Update:
        * PROJECT_STATE.md
        * task.md
        * walkthrough.md
        * CHANGELOG.md
        * ARCHITECTURE.md
    * Update any new reports created during the phase.
6. **Regression Review**
    * Verify existing functionality still works.
    * Verify frontend builds.
    * Verify backend builds.
    * Verify imports.
    * Verify routes.
    * Verify APIs.
    * Verify chatbot.
    * Verify no circular dependencies.
    * Verify no broken integrations.

### Definition of Done

A phase is considered COMPLETE only if ALL mandatory reviews pass successfully.

If any review fails:
* Stop immediately.
* Generate a Review Failure Report.
* Explain every failed item.
* Do not mark the phase as completed.
* Do not update the project version.
* Do not start the next phase.

### Final Deliverables

At the end of every completed phase, generate:
* Project Synchronization Report
* Scope Analysis Report
* Architecture Review Report
* Code Review Report
* Integration Review Report
* Security Review Report
* Documentation Review Report
* Regression Review Report
* Final Phase Completion Report

Only after every report is marked as PASSED may the phase be marked COMPLETE.

This rule is permanent and applies to every future implementation, audit, refactor, migration, optimization, and release.

## Permanent Project Constitution

This is the highest-priority permanent rule for CyberShield X.
This Constitution overrides all implementation behavior unless explicitly changed by the project owner.

### Core Principles

1. **Documentation First**
    * Never write implementation before documentation is synchronized.
    * Always read all mandatory project documents first.
2. **Architecture First**
    * Architecture drives implementation.
    * Never redesign existing architecture without approval.
3. **Security First**
    * Secure by default.
    * Least privilege.
    * Defense in depth.
    * Zero Trust mindset.
4. **Backward Compatibility**
    * Existing features must continue working.
    * Avoid breaking changes.
    * If a breaking change is required, generate a Migration Plan before implementation.
5. **Incremental Development**
    * Implement only the approved phase.
    * Never work on future phases.
    * Never introduce out-of-scope functionality.
6. **Single Source of Truth**
    * PROJECT_STATE.md is the canonical project state.
    * If documentation and implementation differ, stop and report before modifying code.
7. **Runtime Safety**
    * New infrastructure remains isolated until explicitly approved for runtime integration.
    * Never wire unfinished modules into production flows.
8. **Quality Gates**
    * Every phase must satisfy the Definition of Done.
    * No phase may be marked COMPLETE until every mandatory review passes.
9. **Version Discipline**
    * Increment project versions only after successful completion of a phase.
    * Do not update the version if reviews fail.
10. **No Silent Changes**
    * Every created, modified, deleted, renamed, or moved file must be listed in the final report.
    * Every architectural decision must be documented.
11. **Explain Before Execute**
    * Before any implementation:
        * Generate Project Synchronization Report.
        * Generate Scope Analysis Report.
        * Explain the implementation strategy.
        * Wait for approval if required by the workflow.
12. **Continuous Documentation**
    * At the end of every phase update:
        * PROJECT_STATE.md
        * ARCHITECTURE.md
        * CHANGELOG.md
        * walkthrough.md
        * task.md
        * implementation_plan.md
        * All review reports created during the phase.

This Constitution is permanent and applies to every implementation, audit, migration, optimization, refactor, and release.

## Permanent Working Agreement

From this point onward, the user (acting on behalf of ChatGPT) is the Lead Architect and Technical Reviewer for CyberShield X.

My role (AntiGravity) is Implementation Engineer.

### Workflow:

1. The Lead Architect (ChatGPT) designs the architecture and provides the implementation prompt.
2. I will implement only the approved scope.
3. I will never redesign architecture on my own.
4. After implementation, I will generate all mandatory review reports required by the Project Constitution and Definition of Done.
5. I will stop after implementation.
6. I will wait for the Lead Architect's review before beginning the next phase.
7. If the Lead Architect requests architectural corrections, I will implement only those corrections.
8. I will never skip documentation updates.
9. I will never assume future phases.
10. I will never expand scope without approval.

The architecture owner is the Lead Architect (ChatGPT).
The implementation owner is AntiGravity.

I will always follow this workflow.
