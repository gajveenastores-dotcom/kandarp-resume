export const profile = {
  name: 'Kandarp Mathur',
  city: 'Ahmedabad, India',
  headline: 'Product Owner · AI Platforms · Builder',
  tagline: 'I build products that turn conversation and data into measurable outcomes.',
  email: 'mathurkandarp@gmail.com',
  phone: '+91 8109901136',
  linkedin: 'https://linkedin.com/in/kandarpmathur14',
  linkedinHandle: 'linkedin.com/in/kandarpmathur14',
};

export const chapters = [
  {
    id: 'who',
    number: '01',
    title: 'Who I Am',
    subtitle: 'Opening',
    blocks: [
      { type: 'lead', text: profile.tagline },
      {
        type: 'paragraph',
        text: 'I am a Product Owner and builder based in Ahmedabad. I lead teams shipping AI products for fitness, edtech, and wellness — and I still write code when the product demands it.',
      },
      {
        type: 'meta',
        items: [
          { label: 'Location', value: profile.city },
          { label: 'Focus', value: 'AI agents · Product · Agile delivery' },
        ],
      },
    ],
  },
  {
    id: 'arc',
    number: '02',
    title: 'The Arc',
    subtitle: 'Career journey',
    blocks: [
      {
        type: 'paragraph',
        text: 'My path wasn’t linear — it was a steady climb from engineering foundations into data, business analysis, and product ownership at scale.',
      },
      {
        type: 'timeline',
        items: [
          {
            period: '2025 — Present',
            role: 'Product Owner · OMAP',
            org: 'AltaDX (formerly DX Factor Solutions Pvt Ltd)',
            detail:
              'Leading product for an AI agent platform — backlog, discovery, delivery, and agile ceremonies for a 25-person team.',
          },
          {
            period: '2019 — 2025',
            role: 'Business Analyst',
            org: 'KTek Resourcing',
            detail:
              'Requirements, solution design, API integrations, and reporting. Improved onboarding efficiency by 30% through workflow redesign and automation.',
          },
          {
            period: '2014 — 2018',
            role: 'Reporting Analyst',
            org: 'Wealth It Global',
            detail:
              'Built pipelines and dashboards in Excel, Power BI, and SQL. Cut manual reporting by 40% through automation.',
          },
          {
            period: '2013',
            role: 'Trainer',
            org: 'Qpid Outsourcing',
            detail: 'Learning programs, SOPs, and cross-functional workshops.',
          },
          {
            period: '2009 — 2013',
            role: 'B.E. Mechanical Engineering',
            org: 'Rajiv Gandhi Prodyogiki Vishwavidyalaya',
            detail: 'Analytical foundation that later shaped my data-driven product thinking.',
          },
        ],
      },
    ],
  },
  {
    id: 'altadx',
    number: '03',
    title: 'AltaDX · OMAP',
    subtitle: 'Where I work today',
    blocks: [
      {
        type: 'paragraph',
        text: 'At AltaDX — formerly DX Factor Solutions Pvt Ltd — I manage a team of 25 people building OMAP: a platform that lets enterprises create AI agents and deploy them inside existing workflows.',
      },
      {
        type: 'paragraph',
        text: 'OMAP serves fitness, edtech, and wellness operators who need agents for acquisition, retention, and operations — without ripping out the systems they already run.',
      },
      {
        type: 'list',
        title: 'What I own day to day',
        items: [
          'Product backlog, research, and feature design',
          'End-to-end product flows and story writing with the team',
          'Sprint planning, daily scrums, grooming, and reviews',
          'The intersection of Product Owner, Scrum Master, and project delivery',
        ],
      },
      {
        type: 'highlight',
        text: '100+ fitness operators on the platform — outcomes over output, every sprint.',
      },
    ],
  },
  {
    id: 'round1',
    number: '04',
    title: 'Round1',
    subtitle: 'Founder · Builder · One-man team',
    blocks: [
      {
        type: 'paragraph',
        text: 'Round1 is AI-powered first-round interview screening — built for how hiring actually works. I am the founder, developer, and product owner. I designed and shipped every layer of it.',
      },
      {
        type: 'quote',
        text: 'Stop trusting resumes. Know who to hire before Round 2.',
      },
      {
        type: 'list',
        title: 'What it does',
        items: [
          'Browser-based voice interviews — candidates join via link, no human needed for round one',
          'Adaptive AI questions from job description and experience level',
          'Instant assessment reports: scores, strengths, risks, integrity signals, full transcript, PDF to recruiter inbox',
          'Quick Apply self-schedule portal — share a link, candidates pick their slot',
          'Inbound email agent — forward a candidate email, interview auto-created',
          'Multi-role orgs: owner, admin, team leads, recruiters — analytics, quotas, executive reports',
        ],
      },
      {
        type: 'list',
        title: 'Stack I built',
        items: [
          'Next.js · TypeScript · Supabase · OpenAI · Inngest · Postmark · Vercel',
        ],
      },
    ],
  },
  {
    id: 'abc',
    number: '05',
    title: 'Analystbychance',
    subtitle: 'Edtech · Mentorship',
    blocks: [
      {
        type: 'paragraph',
        text: 'Analystbychance is an edtech mentorship platform I run — helping people from any background transition into Business Analyst, Product Owner, and Data Analyst roles through one-on-one mentorship.',
      },
      {
        type: 'list',
        title: 'What we offer',
        items: [
          'Practical roadmaps — not theory decks',
          '1:1 mentorship tailored to where you are today',
          'Community and feedback loops for aspiring analysts and POs',
          '1000+ mentees helped break into tech roles',
        ],
      },
    ],
  },
  {
    id: 'craft',
    number: '06',
    title: 'How I Work',
    subtitle: 'Philosophy',
    blocks: [
      {
        type: 'paragraph',
        text: 'I sit where product strategy meets execution. Discovery before delivery. Stories that engineers can ship. Ceremonies that protect focus instead of filling calendars.',
      },
      {
        type: 'list',
        title: 'Principles',
        items: [
          'Outcomes over output — every feature ties to a metric',
          'Research and design before backlog commitments',
          'Agile in practice: scrums, grooming, reviews I actually run',
          'Data-informed decisions: Power BI, SQL, APIs, integrations',
        ],
      },
      {
        type: 'chips',
        title: 'Certifications',
        items: ['CSM®', 'SAFe® 6 POPM', 'Salesforce AI Associate', 'Registered Scrum Basics™'],
      },
    ],
  },
  {
    id: 'proof',
    number: '07',
    title: 'Proof',
    subtitle: 'Impact',
    blocks: [
      {
        type: 'stats',
        items: [
          { value: '25', label: 'People led at AltaDX' },
          { value: '100+', label: 'Fitness operators on OMAP' },
          { value: '1000+', label: 'Mentees via Analystbychance' },
          { value: 'Solo', label: 'Round1 — founder to production' },
        ],
      },
      {
        type: 'list',
        title: 'Selected outcomes',
        items: [
          '30% onboarding efficiency gain at KTek through workflow redesign',
          '40% reduction in manual reporting at Wealth It Global',
          'Full SaaS for Round1: trial, billing, multi-tenant orgs, integrity tracking',
        ],
      },
    ],
  },
  {
    id: 'contact',
    number: '08',
    title: 'Contact',
    subtitle: 'Let\'s connect',
    blocks: [
      {
        type: 'paragraph',
        text: 'Scroll the story — or tap Talk to me and ask anything directly. I speak in first person and know everything on this resume.',
      },
      {
        type: 'links',
        items: [
          { label: 'Email', href: `mailto:${profile.email}`, value: profile.email },
          { label: 'LinkedIn', href: profile.linkedin, value: profile.linkedinHandle },
          { label: 'Phone', href: `tel:${profile.phone.replace(/\s/g, '')}`, value: profile.phone },
        ],
      },
    ],
  },
];

export const voiceSystemPrompt = `You ARE Kandarp Mathur on a live voice call about your own career. Speak ONLY in the first person: always "I", "me", "my", "I've"—never describe yourself as "Kandarp" in third person, never "he" or "him" for yourself. You are not an assistant talking about someone else; you are Kandarp talking to a visitor.

Keep answers short for voice: about two or three sentences. Sound warm, confident, and human.

Identity:
- Product Owner in ${profile.city}.
- Headline: ${profile.headline}

AltaDX (formerly DX Factor Solutions Pvt Ltd):
- I manage a team of 25 people.
- I own OMAP — a platform to create AI agents and deploy them in existing workflows for fitness, edtech, and wellness.
- I manage backlog, research, feature design, flows, stories, sprint planning, daily scrums, grooming, reviews — PO + Scrum Master + PM in one role.
- OMAP serves 100+ fitness operators.

Round1 (I built it — founder, developer, one-man team):
- AI first-round interview screening: browser voice interviews, adaptive questions from JD, instant PDF assessment reports.
- Quick Apply self-schedule, inbound email agent, integrity tracking, multi-role orgs, analytics.
- Stack: Next.js, Supabase, OpenAI, Inngest, Postmark, Vercel.

Analystbychance (I run it):
- Edtech mentorship — any background to BA, PO, or DA roles via 1:1 mentorship.
- 1000+ mentees helped.

Career:
- AltaDX 2025–present: Product Owner.
- KTek Resourcing 2019–2025: Business Analyst.
- Wealth It Global 2014–2018: Reporting Analyst.
- Qpid Outsourcing 2013: Trainer.
- B.E. Mechanical Engineering, RGPV 2009–2013.

Skills: Product Management, AI Agents, Agile/Scrum/SAFe, Power BI, SQL, APIs, JIRA, Confluence.
Certs: CSM®, SAFe® 6 POPM, Salesforce AI Associate.

Contact: ${profile.phone}, ${profile.email}, ${profile.linkedinHandle}.`;
