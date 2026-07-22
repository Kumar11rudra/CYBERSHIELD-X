'use strict';

class EscapeUtils {
    static escapeHtml(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    static escapeMarkdown(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\*/g, '\\*')
            .replace(/_/g, '\\_')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}')
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)')
            .replace(/#/g, '\\#')
            .replace(/\+/g, '\\+')
            .replace(/-/g, '\\-')
            .replace(/\./g, '\\.')
            .replace(/!/g, '\\!')
            .replace(/>/g, '\\>')
            .replace(/\|/g, '\\|');
    }

    static formatSafeHtml(content, indent = '') {
        if (typeof content === 'string') {
            return '&quot;' + this.escapeHtml(content) + '&quot;';
        }
        if (typeof content === 'number' || typeof content === 'boolean') {
            return String(content);
        }
        if (content === null) return 'null';
        if (Array.isArray(content)) {
            if (content.length === 0) return '[]';
            let res = '[\n';
            for (let i = 0; i < content.length; i++) {
                res += indent + '  ' + this.formatSafeHtml(content[i], indent + '  ') + (i < content.length - 1 ? ',' : '') + '\n';
            }
            res += indent + ']';
            return res;
        }
        if (typeof content === 'object') {
            const keys = Object.keys(content);
            if (keys.length === 0) return '{}';
            let res = '{\n';
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                res += indent + '  &quot;' + this.escapeHtml(k) + '&quot;: ' + this.formatSafeHtml(content[k], indent + '  ') + (i < keys.length - 1 ? ',' : '') + '\n';
            }
            res += indent + '}';
            return res;
        }
        return '""';
    }

    static formatSafeMarkdown(content, indent = '') {
        if (typeof content === 'string') {
            return '"' + this.escapeMarkdown(content) + '"';
        }
        if (typeof content === 'number' || typeof content === 'boolean') {
            return String(content);
        }
        if (content === null) return 'null';
        if (Array.isArray(content)) {
            if (content.length === 0) return '[]';
            let res = '[\n';
            for (let i = 0; i < content.length; i++) {
                res += indent + '  ' + this.formatSafeMarkdown(content[i], indent + '  ') + (i < content.length - 1 ? ',' : '') + '\n';
            }
            res += indent + ']';
            return res;
        }
        if (typeof content === 'object') {
            const keys = Object.keys(content);
            if (keys.length === 0) return '{}';
            let res = '{\n';
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                res += indent + '  "' + this.escapeMarkdown(k) + '": ' + this.formatSafeMarkdown(content[k], indent + '  ') + (i < keys.length - 1 ? ',' : '') + '\n';
            }
            res += indent + '}';
            return res;
        }
        return '""';
    }
}

module.exports = EscapeUtils;
