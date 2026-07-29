import React from 'react';

export default function MobileInput({
  countryCode,
  mobileNumber,
  updateForm,
  COUNTRY_CODES,
}) {
  return (
    <div className="space-y-2">
      <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">
        Mobile Number
      </label>
      <div className="flex gap-3">
        <select
          value={countryCode}
          onChange={(e) => updateForm('countryCode', e.target.value)}
          className="w-32 bg-white/[0.03] border border-white/10 rounded-2xl px-3 py-4 font-mono text-sm"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.country} value={c.code}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>
        <input
          value={mobileNumber}
          onChange={(e) => updateForm('mobileNumber', e.target.value)}
          className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50"
          placeholder="9876543210"
        />
      </div>
    </div>
  );
}
