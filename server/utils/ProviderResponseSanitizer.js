class ProviderResponseSanitizer {
    sanitize(payload) {
        if (!payload) return payload;
        
        let stringified;
        try {
            stringified = JSON.stringify(payload);
        } catch (e) {
            return payload; // Un-stringifiable
        }

        // Scrub Authorization Bearer tokens
        stringified = stringified.replace(/Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_=]*/g, 'Bearer [REDACTED]');
        
        // Scrub Basic Auth
        stringified = stringified.replace(/Basic\s+[A-Za-z0-9=]+/g, 'Basic [REDACTED]');
        
        // Scrub API Keys (general heuristic, e.g., 'key': 'sk_live_...')
        stringified = stringified.replace(/("key"|"apikey"|"api_key")\s*:\s*"[^"]+"/gi, '$1: "[REDACTED]"');

        // Scrub internal IP addresses (e.g., 10.x.x.x, 192.168.x.x) - simplistic version
        // Often we don't want to scrub all IPs, but specifically manager IPs if known.
        // For now, we mainly scrub secrets.

        try {
            return JSON.parse(stringified);
        } catch (e) {
            return payload;
        }
    }
}

module.exports = ProviderResponseSanitizer;
