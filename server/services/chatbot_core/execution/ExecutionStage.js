/**
 * @module ExecutionStage
 * @description Represents discrete substeps within an execution.
 */
class ExecutionStage {
    static INIT = 'INIT';
    static PREPARED = 'PREPARED';
    static DISPATCHED = 'DISPATCHED';
    static COMPLETED = 'COMPLETED';
    static FAILED = 'FAILED';
}

module.exports = ExecutionStage;
