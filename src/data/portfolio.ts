export type CommandId =
  | "help"
  | "about"
  | "experience"
  | "projects"
  | "skillset"
  | "certifications"
  | "education"
  | "publications"
  | "connect"
  | "resume";

export type CommandDefinition = {
  id: CommandId;
  label: string;
  aliases: string[];
  description: string;
  sample: string;
};

export type Metric = {
  label: string;
  value: string;
  detail: string;
};

export type ExperienceEntry = {
  company: string;
  role: string;
  period: string;
  location: string;
  highlights: string[];
};

export type ProjectEntry = {
  name: string;
  stack: string;
  year: string;
  summary: string;
  href: string;
  highlights: string[];
};

export type CertificationEntry = {
  name: string;
  issuer: string;
  year: string;
};

export type ConnectEntry = {
  label: string;
  value: string;
  href: string;
};

export type PublicationEntry = {
  title: string;
  venue: string;
  year: string;
  summary: string;
  href: string;
};

export const profile = {
  name: "Piyush Bhuyan",
  role: "Associate Infrastructure Engineer building applied AI systems, backend services, and distributed operational tooling",
  location: "Hyderabad, India",
  status:
    "Currently designing LLM-powered incident automation and multi-agent infrastructure workflows at Keyloop",
  intro:
    "I am a software engineer focused on taking AI beyond prototypes and making it reliable in production. My work sits at the intersection of backend systems, infrastructure operations, and applied AI, where I design LLM-powered workflows for incident triage, decision support, automation, and context-aware operational tooling.",
  focus: [
    "LLM systems for incident triage, recommendation, and intelligent automation",
    "Backend services, data pipelines, and context engineering for production AI",
    "Evaluation loops, multi-agent workflows, and cloud-first operational tooling",
  ],
};

export const metrics: Metric[] = [
  {
    label: "Impact",
    value: "10,000+ hrs",
    detail: "engineering time saved annually through incident automation",
  },
  {
    label: "Automation",
    value: "78%",
    detail:
      "manual intervention reduced through AI-driven triage and recommendation pipelines",
  },
  {
    label: "Scale",
    value: "2,000+",
    detail:
      "servers covered in infrastructure rollout and operational visibility work",
  },
];

export const commands: CommandDefinition[] = [
  {
    id: "help",
    label: "/help",
    aliases: ["menu", "commands"],
    description:
      "List every available section and how to navigate the portfolio.",
    sample: "Try /projects or /experience",
  },
  {
    id: "about",
    label: "/about",
    aliases: ["summary", "intro"],
    description:
      "Who I am, what I build, and the kind of problems I enjoy solving.",
    sample:
      "Applied AI systems for infrastructure, operations, and backend reliability",
  },
  {
    id: "experience",
    label: "/experience",
    aliases: ["work", "work experience"],
    description:
      "Professional timeline, quantified wins, and technical ownership.",
    sample: "Keyloop - from infrastructure intern to AI enablement engineer",
  },
  {
    id: "projects",
    label: "/projects",
    aliases: ["builds", "portfolio"],
    description: "Selected projects across AI, ML, APIs, and deployment.",
    sample: "ContractGuard, Credit Risk ML Platform, Flight Delay Predictor",
  },
  {
    id: "skillset",
    label: "/skillset",
    aliases: ["skills", "stack"],
    description: "Languages, backend, LLM, ML, cloud, and MLOps strengths.",
    sample:
      "Python, FastAPI, Claude, Bedrock, MCP, LangGraph, AWS, scikit-learn",
  },
  {
    id: "certifications",
    label: "/certifications",
    aliases: ["certs"],
    description: "Formal certifications and external learning milestones.",
    sample: "AWS Cloud Practitioner, SAFe Practitioner, NPTEL, Stanford ML",
  },
  {
    id: "education",
    label: "/education",
    aliases: ["academics"],
    description: "Academic background and core foundation.",
    sample: "Vasavi College of Engineering, Information Technology",
  },
  {
    id: "publications",
    label: "/publications",
    aliases: ["writing", "papers"],
    description: "Research papers, articles, and public writing.",
    sample: "Springer conference paper on intrusion detection using hybrid ML",
  },
  {
    id: "connect",
    label: "/connect",
    aliases: ["contact", "links"],
    description: "The fastest ways to reach me or explore my work online.",
    sample: "Email, LinkedIn, GitHub",
  },
  {
    id: "resume",
    label: "/resume",
    aliases: ["download resume", "download-resume", "cv"],
    description: "Download my resume directly from the terminal.",
    sample: "Starts a PDF download in the browser",
  },
];

export const experience: ExperienceEntry[] = [
  {
    company: "Keyloop India",
    role: "Associate Infrastructure Engineer (A.I. Enablement)",
    period: "Jul 2025 - Present",
    location: "Hyderabad",
    highlights: [
      "Saved 10,000+ engineering hours annually with incident automation and AI-powered resolution pipelines.",
      "Shipped incident management platform that cut MTTR by 25%.",
      "Improved operational visibility with ML-powered server context mapping.",
    ],
  },
  {
    company: "Keyloop India",
    role: "Software Development Intern",
    period: "Jan 2025 - Jul 2025",
    location: "Hyderabad",
    highlights: [
      "Deployed security agents across 2,000+ servers for improved visibility.",
      "Built dashboards that sped up review cycles by 25% and saved 6+ hours/week.",
      "Reduced misrouted tickets by 20% with skill-mapping automation.",
    ],
  },
];

export const projects: ProjectEntry[] = [
  {
    name: "ContractGuard",
    stack:
      "FastAPI, React, Celery, Redis, FAISS, OpenRouter, SQLite, Docker Compose",
    year: "2026",
    summary:
      "A full-stack legal AI system for contract ingestion, clause extraction, risk detection, and explainable review workflows.",
    href: "https://github.com/pibuilt/contractguard",
    highlights: [
      "Asynchronous analysis pipeline for upload, extraction, clause review, and grounded risk surfacing.",
      "Hybrid rule-plus-LLM workflow with vector retrieval for explainable contract review.",
    ],
  },
  {
    name: "Credit Risk ML Platform",
    stack:
      "Python, FastAPI, LightGBM, Optuna, MLflow, DVC, SHAP, React, Docker, Nginx",
    year: "2026",
    summary:
      "A production-style credit default prediction platform built end to end, covering reproducible training, explainability, API serving, containerized deployment, and HTTPS delivery.",
    href: "https://github.com/pibuilt/ml-credit-risk",
    highlights: [
      "Hybrid tabular-plus-text modeling with Optuna tuning, SHAP explainability, and tracked experiments.",
      "FastAPI serving with Dockerized deployment and Nginx-backed HTTPS delivery.",
    ],
  },
  {
    name: "Flight Delay Predictor",
    stack:
      "Python, FastAPI, Random Forest, React, Tailwind CSS, Docker, AWS EC2, Nginx, GitHub Actions",
    year: "2026",
    summary:
      "A full-stack flight delay prediction system built end to end, from model training to HTTPS deployment and CI/CD.",
    href: "https://github.com/pibuilt/flight-delay-predictor",
    highlights: [
      "Production-style preprocessing and training flow over roughly 5.8 million flight records.",
      "Full serving stack with FastAPI, React, Docker, AWS EC2, HTTPS, and CI/CD.",
    ],
  },
];

export const skillGroups = [
  {
    name: "Backend + Systems",
    items: [
      "Python",
      "FastAPI",
      "API Design",
      "JavaScript",
      "SQL",
      "Java",
      "Linux",
      "Distributed Systems",
    ],
  },
  {
    name: "LLM + AI Systems",
    items: [
      "Claude",
      "AWS Bedrock",
      "Prompt Engineering",
      "RAG",
      "Multi-Agent Systems",
      "LangGraph",
      "MCP",
      "LangChain",
      "LlamaIndex",
    ],
  },
  {
    name: "ML + Data",
    items: [
      "scikit-learn",
      "TensorFlow",
      "PyTorch",
      "XGBoost",
      "LightGBM",
      "Hugging Face",
      "Model Evaluation",
      "Data Visualization",
    ],
  },
  {
    name: "Cloud + Delivery",
    items: [
      "AWS",
      "Docker",
      "GitHub Actions",
      "CI/CD",
      "MLflow",
      "DVC",
      "Grafana",
      "Workflow Automation",
    ],
  },
  {
    name: "Core Strengths",
    items: [
      "System Design",
      "Context Engineering",
      "Operational Automation",
      "Critical Thinking",
      "Problem Solving",
      "Research",
    ],
  },
];

export const certifications: CertificationEntry[] = [
  {
    name: "AWS Certified Cloud Practitioner (CLF-C02)",
    issuer: "AWS",
    year: "2026",
  },
  {
    name: "Certified SAFe 6 Practitioner",
    issuer: "Scaled Agile",
    year: "2026",
  },
  {
    name: "Machine Learning Specialization",
    issuer: "Stanford University via Coursera",
    year: "2026",
  },
  {
    name: "The Joy of Computing using Python",
    issuer: "NPTEL",
    year: "2022",
  },
];

export const connect: ConnectEntry[] = [
  {
    label: "Email",
    value: "works.piyushb@gmail.com",
    href: "mailto:works.piyushb@gmail.com",
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/piyush-bhuyan-216445230",
    href: "https://linkedin.com/in/piyush-bhuyan-216445230",
  },
  {
    label: "GitHub",
    value: "github.com/pibuilt",
    href: "https://github.com/pibuilt",
  },
];

export const education = {
  institution: "Vasavi College of Engineering",
  location: "Hyderabad",
  period: "Dec 2021 - May 2025",
  degree: "Bachelor of Engineering in Information Technology",
  score: "Grade: 9.04 / 10",
  highlights: [
    "Part of the Toastmasters Club.",
    "Frequent MUNner, with multiple Best Delegate wins, and later served on the executive board.",
    "Won Best Project in the Department of IT.",
    "Led the organizing teams for the annual fest Euphoria in 2023 and 2024.",
  ],
};

export const publications: PublicationEntry[] = [
  {
    title:
      "Layered Security - Gradient Boosting Meets Naive Bayes for Intrusion Detection",
    venue:
      "Sixth Congress on Intelligent Systems (CIS 2025), Springer LNNS Vol. 1837",
    year: "2026",
    summary:
      "Co-authored a conference paper proposing a double-layered hybrid intrusion detection approach that combines Naive Bayes with XGBoost and GAN-based augmentation to improve sparse-class detection and reduce false alarms.",
    href: "https://doi.org/10.1007/978-3-032-18282-1_2",
  },
];

export const publicationNote = "";
