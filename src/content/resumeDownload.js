import { profile } from './resume';

export const resumeDownload = {
  filename: 'Kandarp_Mathur_Resume.pdf',
  summary: `Product Owner and builder based in Ahmedabad, India. I lead a 25-person team shipping OMAP — an AI agent platform for fitness, edtech, and wellness enterprises — and operate at the intersection of Product Owner, Scrum Master, and delivery lead. I also founded and built Round1 (AI interview screening SaaS) solo, and run Analystbychance, a mentorship platform with 1000+ mentees. Outcomes over output: every feature ties to measurable business impact.`,

  competencies: [
    'Product Strategy & Roadmapping',
    'AI Agents & Conversational AI',
    'Agile / Scrum / SAFe Delivery',
    'Discovery, Research & UX Flows',
    'Backlog Management & Story Writing',
    'Stakeholder & Cross-functional Leadership',
    'Power BI · SQL · APIs · Integrations',
    'JIRA · Confluence · Snowflake · Databricks',
  ],

  experience: [
    {
      title: 'Product Owner · OMAP™',
      company: 'AltaDX (formerly DX Factor Solutions Pvt Ltd)',
      location: 'Ahmedabad, India',
      period: 'Jun 2025 – Present',
      bullets: [
        'Lead product for OMAP — a platform enabling enterprises to create AI agents and deploy them inside existing workflows for fitness, edtech, and wellness operators (100+ fitness operators on platform).',
        'Manage a cross-functional team of 25 — engineering, design, and delivery — owning roadmap, prioritization, and release cadence.',
        'Own end-to-end product lifecycle: backlog grooming, user research, feature design, product flows, acceptance criteria, and sprint planning.',
        'Run agile ceremonies daily: standups, backlog refinement, sprint reviews, and retrospectives — blending Product Owner, Scrum Master, and project delivery responsibilities.',
        'Partner with leadership on outcome-based KPIs for acquisition, retention, and operational efficiency — not vanity metrics.',
        'Guide story writing and solution design for AI micro-agents embedded into client management systems and workflows.',
      ],
    },
    {
      title: 'Business Analyst',
      company: 'KTek Resourcing',
      location: 'India',
      period: 'Jan 2019 – Mar 2025',
      bullets: [
        'Led requirements gathering, solution design, and delivery for recruitment systems, API integrations, and enterprise reporting.',
        'Improved onboarding efficiency by 30% through workflow redesign, automation, and tighter stakeholder feedback loops.',
        'Translated business needs into structured specs, user stories, and testable acceptance criteria for dev teams.',
        'Built reporting and analytics views; collaborated on Power BI dashboards and SQL-backed data models.',
      ],
    },
    {
      title: 'Reporting Analyst',
      company: 'Wealth It Global',
      location: 'India',
      period: 'Jan 2014 – Dec 2018',
      bullets: [
        'Built data pipelines and reporting frameworks across Excel, Power BI, and SQL for leadership and operations teams.',
        'Reduced manual reporting effort by 40% through automation, scheduled refreshes, and standardized KPI definitions.',
        'Partnered with stakeholders to instrument the right metrics and improve decision velocity.',
      ],
    },
    {
      title: 'Trainer',
      company: 'Qpid Outsourcing',
      location: 'India',
      period: 'Jun 2013 – Dec 2013',
      bullets: [
        'Designed and delivered learning programs, SOPs, and cross-functional workshops.',
        'Strengthened team collaboration and operational consistency across functions.',
      ],
    },
  ],

  products: [
    {
      name: 'Round1 — AI Interview Screening (Founder · Solo Builder)',
      period: '2024 – Present',
      tagline: 'Stop trusting resumes. Know who to hire before Round 2.',
      bullets: [
        'Founded, designed, and built Round1 end-to-end as a one-person team — product, engineering, and go-to-market.',
        'Browser-based voice AI interviews: candidates join via link; adaptive questions from JD and experience level; no human needed for round one.',
        'Instant assessment reports (0–100 scores, strengths, weaknesses, risks, integrity signals, full transcript) with PDF attached to recruiter inbox.',
        'Quick Apply self-schedule portal, inbound email agent (forward candidate email → auto-created interview), multi-role orgs, analytics dashboards, executive org reports.',
        'Integrity tracking: tab switches, off-screen time, suspicion scoring; experience-based question depth and duration.',
        'Full SaaS: 14-day trial, usage quotas, billing (Dodo Payments), team management, automated emails (Postmark + Inngest).',
        'Stack: Next.js 16 · TypeScript · Supabase · OpenAI GPT-4o / GPT-4o-mini · Inngest · Postmark · Vercel · Sentry.',
      ],
    },
    {
      name: 'OMAP™ — Outcomes Micro Agents Platform',
      period: '2025 – Present · AltaDX',
      tagline: 'AI agents that deploy into existing enterprise workflows.',
      bullets: [
        'Platform of micro-agents for acquisition, retention, and operations — embedded into fitness, edtech, and wellness stacks.',
        'Deep integrations with leading management systems; serving 100+ fitness operators.',
        'Product ownership across discovery, design, backlog, and agile delivery for a 25-person team.',
      ],
    },
    {
      name: 'Analystbychance — Edtech Mentorship Platform',
      period: 'Ongoing · Founder / Operator',
      tagline: 'Any background → Business Analyst, Product Owner, or Data Analyst.',
      bullets: [
        'Run a mentorship platform helping career switchers break into BA, PO, and DA roles through 1:1 guidance.',
        'Practical roadmaps, portfolio feedback, and community support — not theory-only courses.',
        '1000+ mentees supported in transitioning into tech and analytics roles.',
      ],
    },
  ],

  education: [
    {
      degree: 'Bachelor of Engineering · Mechanical Engineering',
      school: 'Rajiv Gandhi Prodyogiki Vishwavidyalaya (RGPV)',
      period: '2009 – 2013',
      note: 'Engineering foundation with analytical rigor; translated into data-driven product thinking and systems-level reasoning.',
    },
  ],

  certifications: [
    'Certified ScrumMaster (CSM®)',
    'SAFe® 6 Product Owner / Product Manager',
    'Salesforce Certified AI Associate',
    'Registered Scrum Basics™',
  ],

  skills: {
    Product: ['Product Management', 'Roadmapping', 'Discovery & Research', 'User Story Writing', 'Stakeholder Management'],
    Agile: ['Scrum', 'SAFe', 'Sprint Planning', 'Backlog Grooming', 'Ceremony Facilitation'],
    Data: ['Power BI', 'SQL', 'Excel', 'Snowflake', 'Databricks', 'KPI Design'],
    Technical: ['API Integrations', 'AI Agents', 'Conversational AI', 'JIRA', 'Confluence'],
  },

  highlights: [
    '25-person team leadership at AltaDX',
    '100+ fitness operators on OMAP platform',
    'Round1: solo founder — idea to production SaaS',
    '1000+ mentees via Analystbychance',
    '30% onboarding efficiency improvement (KTek)',
    '40% manual reporting reduction (Wealth It Global)',
  ],

  contact: profile,
};
