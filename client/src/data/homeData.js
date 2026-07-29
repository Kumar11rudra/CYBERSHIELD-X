export const team = [
  { 
    name: 'Anil Kumar',
    role: 'Founder & Cybersecurity Analyst',
    color: '00bfff',
    email: 'official.cybershieldx@gmail.com',
    phone: '+919351636193',
    isFounder: true
  },
  {
    name: 'Suryansh Pandey',
    role: 'Data Analyst',
    color: '00ff88',
    email: 'pandeysuryansh560@gmail.com',
    phone: '+917565813054'
  },
  {
    name: 'Aryan Patel',
    role: 'AI & Machine Learning',
    color: 'ff8c00',
    email: 'aryanpatel9171235114@gmail.com',
    phone: '+919827035235'
  },
  {
    name: 'Pranav Kumar',
    role: 'Data Analyst',
    color: 'b400ff',
    email: 'Parmarpranav57@gmail.com',
    phone: '+918529395855'
  },
  {
    name: 'Ankita',
    role: 'Network Analyst',
    color: 'ff2244',
    email: 'pinksigar@gmail.com',
    phone: ''
  }
];

export const modules = [
    {
      id: 'dns',
      icon: '🌐',
      title: 'DNS Enumeration Engine',
      desc: 'Query primary DNS records and discover subdomains to map remote hosting architecture.',
      engine: 'dns',
      intelCount: 'DNS Zones',
      tag: 'RECON',
      color: 'blue',
      path: '/toolkit/dns',
    },
    {
      id: 'http',
      icon: '🌍',
      title: 'HTTP Security Engine',
      desc: 'Perform deep HTTP analysis, header inspection, and check for misconfigurations.',
      engine: 'http',
      intelCount: 'Headers & Config',
      tag: 'WEB',
      color: 'orange',
      path: '/toolkit/http',
    },
    {
      id: 'port',
      icon: '📡',
      title: 'Port & Service Engine',
      desc: 'Scan open ports and discover network services running on target hosts.',
      engine: 'port',
      intelCount: 'Open Ports',
      tag: 'RECON',
      color: 'green',
      path: '/toolkit/port',
    },
    {
      id: 'service_fingerprint',
      icon: '🧪',
      title: 'Service Fingerprint Engine',
      desc: 'Analyze network responses to fingerprint operating systems and specific service versions.',
      engine: 'service_fingerprint',
      intelCount: 'OS & Versions',
      tag: 'VULNERABILITY',
      color: 'red',
      path: '/toolkit/service_fingerprint',
    },
    {
      id: 'ssl',
      icon: '🔒',
      title: 'SSL/TLS Security Engine',
      desc: 'Connect directly to retrieve certificate details, TLS protocol version, and calculate a trust grade.',
      engine: 'ssl',
      intelCount: 'Grade A-F',
      tag: 'VULNERABILITY',
      color: 'green',
      path: '/toolkit/ssl',
    },
    {
      id: 'tech_detection',
      icon: '🕸️',
      title: 'Technology Detection Engine',
      desc: 'Fingerprint remote web applications to identify frameworks, CMS, and analytics tools.',
      engine: 'tech_detection',
      intelCount: 'Tech Stack',
      tag: 'RECON',
      color: 'purple',
      path: '/toolkit/tech_detection',
    },
    {
      id: 'url',
      icon: '☣️',
      title: 'URL & Threat Intel Engine',
      desc: 'Scan URLs and IPs against threat intelligence databases to identify malware and abuse.',
      engine: 'url',
      intelCount: 'Threat Score',
      tag: 'INTEL',
      color: 'red',
      path: '/toolkit/url',
    },
    {
      id: 'whois',
      icon: '🌐',
      title: 'WHOIS Record Engine',
      desc: 'Look up registration details, registrar, creation date, and name servers.',
      engine: 'whois',
      intelCount: 'Registry Info',
      tag: 'RECON',
      color: 'blue',
      path: '/toolkit/whois',
    }
  ];