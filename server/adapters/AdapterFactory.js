/**
 * @module AdapterFactory
 * @description The ONLY class permitted to instantiate adapters based on an AdapterDescriptor.
 */
const ShellAdapter = require('./providers/ShellAdapter');
const DockerAdapter = require('./providers/DockerAdapter');
const HttpAdapter = require('./providers/HttpAdapter');
const LocalProcessAdapter = require('./providers/LocalProcessAdapter');

class AdapterFactory {
    /**
     * Creates an adapter instance.
     * @param {import('./AdapterDescriptor')} descriptor
     * @returns {import('./CapabilityAdapter')}
     */
    createAdapter(descriptor) {
        if (!descriptor || !descriptor.adapterId) {
            throw new Error("Valid AdapterDescriptor required to instantiate adapter.");
        }

        if (['Deprecated', 'Disabled'].includes(descriptor.lifecycleStatus)) {
            throw new Error(`Cannot instantiate adapter in state: ${descriptor.lifecycleStatus}`);
        }

        switch (descriptor.adapterType) {
            case 'Shell':
            case 'CLI':
                return new ShellAdapter(descriptor);
            case 'Docker':
                return new DockerAdapter(descriptor);
            case 'HTTP':
            case 'API':
                return new HttpAdapter(descriptor);
            case 'LocalProcess':
                return new LocalProcessAdapter(descriptor);
            default:
                throw new Error(`Unsupported adapterType: ${descriptor.adapterType}`);
        }
    }
}

module.exports = AdapterFactory;
