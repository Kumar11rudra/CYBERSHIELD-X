// Legacy websocket emitter abstraction for V13
class SocketNotificationService {
    constructor(io) {
        this.io = io;
    }

    emitToolLog(jobId, logData) {
        if (!this.io) return;
        this.io.to(jobId).emit('tool_log', logData);
    }

    emitToolComplete(jobId, finalResult) {
        if (!this.io) return;
        this.io.to(jobId).emit('tool_complete', finalResult);
    }
}

module.exports = SocketNotificationService;
