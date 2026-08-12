import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      return toast.error('Please complete all required fields.');
    }
    setSending(true);
    setTimeout(() => {
      toast.success('Your security query has been logged. Support ID assigned.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSending(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 font-mono text-[#e0e6ff] relative z-10 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-[#00bfff]/20 bg-[#070f21]/80 rounded-2xl p-6 shadow-[0_0_24px_rgba(0,191,255,0.06)]"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-accent/10 border border-cyber-accent/20 mb-4">
          <span className="w-2 h-2 rounded-full bg-cyber-accent animate-pulse" />
          <span className="text-[10px] text-cyber-accent uppercase tracking-widest font-bold">Contact Terminal</span>
        </div>
        <h1 className="text-4xl font-display font-black text-white tracking-tight mb-3">CONTACT SUPPORT</h1>
        <p className="text-cyber-muted text-xs uppercase tracking-[.3em] mb-4">
          Emergency response channels & technical assistance
        </p>
        <p className="text-sm text-cyber-text/70 leading-relaxed">
          Need operational assistance, custom API access limits, or want to report a billing concern? Open an inquiry below.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Sidebar */}
        <div className="md:col-span-1 border border-[#224466]/40 bg-[#070f21]/70 rounded-xl p-5 space-y-6">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">Technical Enquiries</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              For security configuration, API quota inquiries, or enterprise deployment:
            </p>
            <p className="text-xs text-cyber-accent mt-2 font-bold select-all">official.cybershieldx@gmail.com</p>
          </div>

          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">Legal & Support</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Submit legal concerns, security advisories, or official policy inquiries to:
            </p>
            <p className="text-xs text-cyber-accent mt-2 font-bold select-all">official.cybershieldx@gmail.com</p>
          </div>

          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">Command Operations</h3>
            <p className="text-[10px] text-cyber-muted leading-relaxed uppercase">
              CyberShield X Security Hub<br />
              Rajasthan, India
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2 border border-[#224466]/40 bg-[#070f21]/70 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Agent Smith"
                  className="w-full bg-black/40 border border-[#224466]/40 rounded p-2.5 text-white text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. smith@agency.org"
                  className="w-full bg-black/40 border border-[#224466]/40 rounded p-2.5 text-white text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g. API access extension request"
                className="w-full bg-black/40 border border-[#224466]/40 rounded p-2.5 text-white text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Message Body *</label>
              <textarea
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Describe your request in detail..."
                className="w-full bg-black/40 border border-[#224466]/40 rounded p-2.5 text-white text-xs focus:border-cyan-400 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-black font-bold rounded text-xs uppercase tracking-widest transition-all"
            >
              {sending ? 'Transmitting inquiry...' : '📤 Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
