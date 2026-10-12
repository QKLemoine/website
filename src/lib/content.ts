export const profile = {
  name: "Quinten Lemoine",
  title: "AI/ML Developer & Technical Researcher",
  /** The one part of the title shown in the accent colour. Must appear in it. */
  titleHighlight: "AI/ML",
  pitch:
    "Building machine learning models and autonomous systems — from clinical genomics to multi-robot perception.",
  email: "qklemoine@gmail.com",
  linkedin: "https://linkedin.com/in/quintenlemoine",
  github: "https://github.com/QKLemoine",
  location: "Atlanta, GA",
  availability:
    "Open to internships and new-grad roles in ML and software engineering.",
  /** Shown in the hero after "Currently:". Keep it to one line. */
  currently:
    "AI/Clinical Data Intern at FDNA, building ML models for genetic-disease diagnosis.",
}

/** Example questions the hero's "Ask me" bar cycles through. */
export const askExamples = [
  "What are you working on at FDNA?",
  "How accurate is the flood prediction model?",
  "Which robotics algorithms have you built from scratch?",
  "Are you open to internships?",
]

export const about = [
  "I'm a Computer Science student at Georgia Tech (Intelligence and Theory threads), currently working as an AI/Clinical Data Intern at FDNA, where I help build machine learning models that support genetic-disease diagnosis for geneticists in 130+ countries — cleaning and preparing real-world clinical data spanning 100,000+ patients and helping evaluate model performance across disease categories.",
  "Outside of that, I do research through two Georgia Tech programs. With Big Data Big Impact, I built an LSTM-based flood and drought prediction model covering Asia that reached 85% accuracy on historical flood events. With The Robot Collective VIP, I work on real-time perception and state estimation for multi-robot systems, fusing YOLO-based vision, LiDAR, and IMU data under real-time latency constraints.",
  "My background started in hands-on fabrication — I led machining for my FRC robotics team through back-to-back World Championship appearances — and that first-principles instinct carries into how I build software: modular, benchmarked, and rebuilt from scratch when it helps me understand it better. I'm fluent in English, French, and Dutch (native).",
]

export const education = {
  school: "Georgia Institute of Technology",
  location: "Atlanta, GA",
  degree: "Bachelor of Science in Computer Science",
  threads: ["Intelligence", "Theory"],
  coursework: [
    "Data Structures & Algorithms",
    "Discrete Mathematics",
    "Linear Algebra",
    "Probability & Statistics",
    "Theory of Computation",
    "Advanced Algorithms",
    "Artificial Intelligence",
  ],
}

export type SkillGroup = { label: string; items: string[] }

export const skills: SkillGroup[] = [
  { label: "Languages", items: ["Python", "Java", "C", "SQL"] },
  {
    label: "Machine Learning",
    items: [
      "Deep Learning",
      "Computer Vision",
      "LSTMs",
      "Reinforcement Learning",
      "Behavioral Cloning",
      "Model Evaluation",
    ],
  },
  {
    label: "Robotics",
    items: [
      "ROS",
      "Multi-Agent Systems",
      "State Estimation",
      "Monte Carlo Localization",
      "RRT*",
      "LiDAR / IMU fusion",
    ],
  },
  {
    label: "Tools",
    items: [
      "PyTorch",
      "OpenCV",
      "MediaPipe",
      "YOLO",
      "MuJoCo",
      "Git",
      "Jenkins",
      "AWS (RDS)",
      "CNC",
      "CAD",
    ],
  },
]

export const spokenLanguages = ["English", "French", "Dutch"]

export type ProjectLink = { label: string; href: string }

export type Project = {
  title: string
  /** One line for the card. */
  summary: string
  /** The longer write-up, shown when a card is expanded. */
  description: string
  tech: string[]
  /**
   * The one concrete result the card leads with. `metric` is the few words
   * shown in the accent colour; `label` finishes the sentence.
   */
  outcome?: { metric: string; label: string }
  /** Repo, demo or paper links, shown on the card when present. */
  links?: ProjectLink[]
  /**
   * Optional figure, screenshot or demo GIF, e.g.
   * "/projects/ai-personal-trainer.gif". A thumbnail appears on hover and the
   * full image when the card is expanded.
   */
  image?: string
  /** Describes the image for screen readers. */
  imageAlt?: string
}

export const projects: Project[] = [
  {
    title: "AI Personal Trainer",
    summary:
      "A real-time computer vision coach that counts reps and assesses exercise form from a camera feed.",
    description:
      "A real-time computer vision pipeline that tracks body landmarks, computes joint angles, counts repetitions, and assesses exercise form — aimed at bringing quality fitness coaching to anyone with a camera. Landmark extraction is decoupled from correction logic in a modular pose-detection architecture, and Dynamic Time Warping compares a user's movement against reference form to drive live visual feedback.",
    tech: ["Python", "OpenCV", "MediaPipe", "Dynamic Time Warping"],
    outcome: {
      metric: "Real-time",
      label: "rep counting and form feedback from a single camera",
    },
  },
  {
    title: "Autonomous Robotics Toolkit",
    summary:
      "From-scratch implementations of core robotics algorithms: segmentation, path planning, localization and imitation learning.",
    description:
      "A from-scratch sandbox for implementing and benchmarking foundational robotics algorithms without relying on black-box middleware. Includes a tabletop instance-segmentation pipeline (RANSAC plane fitting plus connected-components labeling) for raw RGB-D point clouds, a 2D path-planning library built on RRT* with recursive trajectory smoothing, a Monte Carlo Localization engine using particle filters and custom LiDAR ray-casting to solve the kidnapped-robot problem, and a behavioral-cloning module that trains neural network policies for multi-legged locomotion in MuJoCo.",
    tech: ["Python", "PyTorch", "MuJoCo"],
    outcome: {
      metric: "4 algorithms",
      label: "built from scratch, with no black-box middleware",
    },
  },
  {
    title: "Pooling Strategy Analysis in CNNs",
    summary:
      "A mathematical and empirical comparison of CNN pooling methods across three PyTorch architectures.",
    description:
      "A mathematical and empirical study of how different CNN pooling methods affect feature extraction and classification accuracy. I designed and trained three image-classification architectures in PyTorch to benchmark training speed, inference efficiency, and accuracy tradeoffs across pooling strategies and hyperparameters on large-scale datasets.",
    tech: ["Python", "PyTorch"],
    outcome: {
      metric: "3 architectures",
      label: "benchmarked on training speed, inference cost and accuracy",
    },
  },
  {
    title: "AI Paper Finder",
    summary:
      "A script that surfaces high-signal arXiv papers and summarizes their abstracts.",
    description:
      "A workflow tool for keeping pace with AI research. A custom Arxiv API script surfaces high-signal papers and automatically summarizes their abstracts, cutting down daily reading time while keeping me current with the field.",
    tech: ["Python", "Arxiv API"],
    outcome: {
      metric: "Daily digest",
      label: "of high-signal arXiv papers with summarized abstracts",
    },
  },
  {
    title: "Course Scheduling Platform",
    summary:
      "A web app that gives teachers event management and students one calendar across all their classes.",
    description:
      "A web application that lets teachers manage class events and gives students a single consolidated calendar across every class they're enrolled in. Backed by a relational SQL schema modeling teachers, classes, students, and events, hosted on AWS RDS with schema design and query performance tuned for per-class and cross-class calendar queries.",
    tech: ["Python", "SQL", "AWS (RDS)"],
    outcome: {
      metric: "1 calendar",
      label: "across every class a student is enrolled in",
    },
  },
]

export type ExperienceEntry = {
  org: string
  role: string
  location: string
  dates: string
  bullets: string[]
}

export const experience: ExperienceEntry[] = [
  {
    org: "FDNA",
    role: "AI / Clinical Data Intern",
    location: "Atlanta, GA",
    dates: "Aug. 2026 – Present",
    bullets: [
      "Support development of machine learning models used by geneticists across 130+ countries to aid diagnosis of genetic diseases.",
      "Work with real-world clinical datasets spanning 100,000+ patients and thousands of distinct disease phenotypes, performing data cleaning, feature preparation, and quality checks across multi-parameter patient records.",
      "Contribute to model evaluation, assessing performance across diverse disease categories to help guide model improvements.",
      "Collaborate with data scientists and clinical experts to prepare datasets and validate model outputs for a diagnostic tool used in global clinical settings.",
    ],
  },
  {
    org: "Big Data Big Impact (Georgia Tech)",
    role: "AI/ML Developer — Aquatic Sustainability Project",
    location: "Atlanta, GA",
    dates: "Sep. 2025 – Present",
    bullets: [
      "Built an LSTM-based flood and drought prediction model covering Asia, processing millions of geospatial and climate radar-derived data points on rainfall, elevation, and runoff to generate flood risk predictions.",
      "Engineered a geospatial gradient visualization mapping predicted water accumulation and runoff severity across regional grid cells, translating raw model output into an interpretable risk heatmap for faculty and domain experts.",
      "Expanded the model with temperature and elevation feature pipelines, improving prediction accuracy and generalization across diverse flood events — up to 85% accuracy on historical flood events.",
    ],
  },
  {
    org: "The Robot Collective VIP, Georgia Tech",
    role: "Undergraduate Technical Researcher",
    location: "Atlanta, GA",
    dates: "Nov. 2025 – Aug. 2026",
    bullets: [
      "Built real-time perception and state-estimation software for a research-scale Robotarium replica, fusing YOLO-based vision, LiDAR, and IMU data streams under real-time latency constraints.",
      "Replaced AprilTag-based tracking with a custom YOLO-based detection and bounding-box pipeline, improving robustness of multi-robot state estimation.",
      "Refactored legacy ROS nodes to support concurrent, multi-robot autonomous following and collaboration.",
      "Researched the MARLIN framework (Multi-Agent Reinforcement Learning guided by Language-based Inter-robot Negotiation), exploring how LLMs can guide reinforcement learning through inter-agent communication.",
    ],
  },
  {
    org: "IHOT FRC Robotics",
    role: "Machining Lead",
    location: "Atlanta, GA",
    dates: "Sep. 2022 – May 2024",
    bullets: [
      "Led machining and fabrication for a 40-member team, aided in autonomous programming design, and organized workshops, guiding the team to back-to-back FRC World Championship appearances and a Top 5% international ranking.",
      "Contributed to team awards, including Quality Award (3×), Autonomous Award (4×), and Industrial Award.",
    ],
  },
  {
    org: "ERMI-Motion",
    role: "Machinist Intern",
    location: "Atlanta, GA",
    dates: "July 2023",
    bullets: [
      "Operated industrial CNC machines to manufacture high-precision components for medical rehabilitation equipment.",
    ],
  },
  {
    org: "Georgia Tech – Seth Bonder Camp",
    role: "Teaching Assistant / Student Mentor",
    location: "Atlanta, GA",
    dates: "June 2023",
    bullets: [
      "Mentored high school students in programming, data analysis, and introductory machine learning, guiding hands-on projects.",
    ],
  },
  {
    org: "Big Huge Games",
    role: "Data Analyst Intern",
    location: "Timonium, MD",
    dates: "June 2022",
    bullets: [
      "Analyzed game datasets to identify player trends and generated actionable recommendations for product improvement.",
    ],
  },
]
