class TargetClassifier {
    detectType(target) {
        if (!target || typeof target !== 'string') return 'UNKNOWN';
        const trimmed = target.trim();
        
        // IP Address (v4 and v6)
        const ipV4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipV6Regex = /^([0-9a-fA-F:]+)$/;
        if (ipV4Regex.test(trimmed) || ipV6Regex.test(trimmed)) return 'IP';
        
        // Hash (MD5, SHA1, SHA256)
        const hashRegex = /^[a-fA-F0-9]{32,64}$/;
        if (hashRegex.test(trimmed) && !trimmed.includes('.')) return 'HASH';
        
        // URL
        const urlRegex = /^https?:\/\//i;
        if (urlRegex.test(trimmed)) return 'URL';
        
        // Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(trimmed)) return 'EMAIL';
        
        // UPI VPA
        const upiRegex = /^[a-zA-Z0-9.\-_]+@[a-zA-Z]+$/;
        if (upiRegex.test(trimmed)) return 'UPI_VPA';
        
        // Domain (fallback)
        return 'DOMAIN';
    }
}

module.exports = TargetClassifier;
