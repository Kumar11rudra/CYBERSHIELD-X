class JobStatusDTO {
    static PENDING = 'PENDING';
    static QUEUED = 'QUEUED';
    static RUNNING = 'RUNNING';
    static COMPLETED = 'COMPLETED';
    static FAILED = 'FAILED';
    static TIMED_OUT = 'TIMED_OUT';
    static CANCELLED = 'CANCELLED';

    static isValidTransition(current, next) {
        const allowed = {
            [JobStatusDTO.PENDING]: [JobStatusDTO.QUEUED, JobStatusDTO.CANCELLED],
            [JobStatusDTO.QUEUED]: [JobStatusDTO.RUNNING, JobStatusDTO.CANCELLED],
            [JobStatusDTO.RUNNING]: [JobStatusDTO.COMPLETED, JobStatusDTO.FAILED, JobStatusDTO.TIMED_OUT, JobStatusDTO.CANCELLED],
            [JobStatusDTO.COMPLETED]: [],
            [JobStatusDTO.FAILED]: [],
            [JobStatusDTO.TIMED_OUT]: [],
            [JobStatusDTO.CANCELLED]: []
        };
        return allowed[current]?.includes(next) || false;
    }

    static isTerminal(status) {
        return [
            JobStatusDTO.COMPLETED, 
            JobStatusDTO.FAILED, 
            JobStatusDTO.TIMED_OUT, 
            JobStatusDTO.CANCELLED
        ].includes(status);
    }
}

module.exports = JobStatusDTO;
