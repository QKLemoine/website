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
  /** IANA zone for the live local time shown next to the location. */
  timeZone: "America/New_York",
  availability:
    "Open to internships and new-grad roles in ML and software engineering.",
  /** Shown in the hero after "Currently:". Keep it to one line. */
  currently:
    "AI/Clinical Data Intern at FDNA, building ML models for genetic-disease diagnosis.",
}

/** Headline numbers for the stats tile. Each one comes from the résumé. */
export const stats: { value: string; label: string }[] = [
  { value: "130+", label: "countries served by the models I support" },
  { value: "100,000+", label: "patients in the clinical data" },
  { value: "85%", label: "flood-event accuracy" },
  { value: "3", label: "spoken languages" },
]

/**
 * Phrases the editorial layout marks with the highlighter wherever they
 * appear in the about text. Each must match the text exactly.
 */
export const highlights = [
  "130+ countries",
  "100,000+ patients",
  "85% accuracy",
  "back-to-back World Championship appearances",
]

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
  // TODO: expected graduation, e.g. "May 2028". Shown in the timeline once set.
  graduation: "",
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
  /** Describes the image or video for screen readers. */
  imageAlt?: string
  /**
   * Optional demo video, e.g. "/projects/ai-personal-trainer.mp4" (the file
   * lives in public/projects/). In the style variants it loops silently while
   * on screen, with a pause button. `image`, when also set, is its poster frame.
   */
  video?: string
  /**
   * Optional second clip, shown beside the first with its own caption (the
   * two become "Fig. Na" and "Fig. Nb"). Needs `video` or `image` to pair with.
   */
  secondVideo?: { src: string; caption: string; poster?: string }
  /**
   * Optional second figure of stills, shown beside the first the same way.
   * List several images to fit them side by side into that one slot.
   */
  secondImage?: { images: { src: string; alt: string }[]; caption: string }
  /**
   * Set when the images are line drawings on white. They are then shown
   * whole instead of cropped, with the white dropped out so the lines sit on
   * the page in either theme.
   */
  drawing?: boolean
  /** Caption under the figure, shown as "Fig. N: …". */
  figureCaption: string
  /** What the figure should show. Labels the placeholder until `image` is set. */
  figureBrief: string
  /** Optional aside shown as a margin note in the notebook layout. */
  note?: string
  /** The project the bento layout gives the large tile. First one wins. */
  featured?: boolean
}

export const projects: Project[] = [
  {
    title: "Biomechanical Form Tracker & Rep Counter",
    featured: true,
    video: "/projects/form-trainer-demo.mp4",
    image: "/projects/form-trainer-demo.jpg",
    figureCaption:
      "Each arm tracked on its own in the phone's browser, calibrated to its own range, then counting bicep curls.",
    figureBrief:
      "Screenshot or short GIF of the pose overlay on someone mid-exercise, with the rep counter visible.",
    summary:
      "A pose-based rep counter and form scorer built on MediaPipe, as a Python desktop app and a TypeScript web app that runs in a phone's browser. Its rep-tracking implementation was selected for XERJ's Corpus Hub.",
    description:
      "A pose-based rep counter and form scorer built on MediaPipe, with a Python desktop app and a TypeScript web app that runs in a phone's browser. It counts reps from 3D joint angles calibrated separately for each side of the body, ignores limbs the camera can't see so a hidden arm doesn't add false reps, and scores form by comparing each rep against a recorded golden rep with Dynamic Time Warping; its tests replay real recorded landmark data. The rep-tracking implementation, built to hold up against noisy, biased and hidden landmarks, was selected for XERJ's Corpus Hub, an open index of code solutions that AI coding agents can retrieve as reference implementations, with attribution to me and the repository.",
    tech: ["Python", "TypeScript", "MediaPipe", "OpenCV", "Dynamic Time Warping"],
    outcome: {
      metric: "Per-side calibration",
      label: "and hidden-limb handling for reliable rep counts from noisy pose data",
    },
    // TODO: add { label: "Corpus Hub entry", href: "..." } once you have the link.
    links: [
      { label: "Code on GitHub", href: "https://github.com/QKLemoine/Form-Tracker-Rep-Counter" },
    ],
  },
  {
    title: "Flood Forecasting",
    video: "/projects/flood-model-loop-dark.mp4",
    image: "/projects/flood-model-loop-dark.jpg",
    figureCaption:
      "Inside the model: a CNN per satellite stream, an LSTM reading 32 time steps, terrain added before the decision, then every land cell in Southeast Asia scored.",
    figureBrief: "Demo video of the model and the regional risk map.",
    summary:
      "A multi-stream CNN-LSTM that predicts flood onset across Southeast Asia five days ahead from live satellite data, built with a team in Georgia Tech's Big Data Big Impact Aquatic Sustainability Project.",
    description:
      "For the Aquatic Sustainability Project in Georgia Tech's Big Data Big Impact program, our team built a deep learning model that predicts the onset of floods across Southeast Asia five days in advance from live satellite data. I developed the model side, from data retrieval through to the model's output: pulling the satellite datasets, selecting features, and designing and coding the architecture. The model, a custom PyTorch architecture called DualCNNLSTM, takes three satellite streams: NASA GPM IMERG rainfall, NASA SMAP soil moisture and ECMWF ERA5-Land temperature. Each stream is cropped to a patch around the target location and stacked into a 32-step sequence, and a convolutional encoder per stream, sharing its weights across time steps, turns every frame into one combined 3,072-value vector. A 64-unit LSTM reads those vectors in order, so it can capture slow build-ups such as soil becoming saturated weeks before a storm arrives. Terrain doesn't change over time, so a separate CNN branch encodes elevation and joins the LSTM's output just before the final sigmoid layer. To build the training data, I aligned each source to its own lookback window before documented flood onset dates, added validity-mask channels so the model can tell missing satellite pixels from real zeros, and reduced overfitting with dropout, batch normalization and a rebalanced 75/25 non-flood-to-flood training split. Our best result reached 85% accuracy on historical flood events; in the held-out evaluation of the version described here, the model detected 208 of 264 flood events (78.8% recall) and correctly cleared 47 of 72 non-flood events (75.9% overall accuracy). A batch inference pipeline scores every 1° land cell in the region using fresh satellite data, and the team deployed the model behind a Flask API on Google Cloud Run with Redis caching, feeding an interactive Google Maps risk overlay.",
    tech: ["PyTorch", "CNN-LSTM", "NASA Earthdata", "xarray", "rasterio"],
    outcome: {
      metric: "85% accuracy",
      label:
        "at its best on historical flood events, predicting onset five days ahead from live satellite data",
    },
  },
  {
    title: "Autonomous Robotics Toolkit",
    video: "/projects/demo_planning.mp4",
    image: "/projects/demo_planning.jpg",
    figureCaption:
      "An RRT* path through obstacles, before and after trajectory smoothing.",
    figureBrief:
      "Plot of an RRT* tree and the smoothed path, or the particle filter converging on the robot's position.",
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
    video: "/projects/pooling-demo.mp4",
    image: "/projects/pooling-demo.jpg",
    figureCaption:
      "Four CIFAR-10 classifiers tested on shifted images: at 4 pixels, global pooling loses 2 points of accuracy and windowed pooling loses 8.",
    figureBrief:
      "Chart comparing the pooling methods across the three architectures: accuracy, training speed or both.",
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
    video: "/projects/paperfinder-demo.mp4",
    image: "/projects/paperfinder-demo.jpg",
    figureCaption: "One day's digest: ranked papers with their summaries.",
    figureBrief:
      "Screenshot of the script's output: a list of surfaced papers with summarized abstracts.",
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
    title: "FRC Competition Robots",
    video: "/projects/frc-robot-demo.mp4",
    image: "/projects/frc-robot-demo.jpg",
    imageAlt: "Encore driving itself across the practice field.",
    secondImage: {
      images: [
        { src: "/projects/encore-blue.webp", alt: "Line drawing of Encore." },
        { src: "/projects/carbon.webp", alt: "Line drawing of Carbon." },
      ],
      caption:
        "Line drawings of Encore, left, and Carbon, right, the two competition robots I helped build.",
    },
    drawing: true,
    figureCaption: "Encore driving itself in autonomous mode on the practice field.",
    figureBrief:
      "Video of the robot in a match or driving autonomously, or photos of parts you machined.",
    summary:
      "Two seasons as machining lead on a 40-member FIRST Robotics team, building the robots and helping design their autonomous pathing and decision making.",
    description:
      "As machining lead for IHOT FRC Robotics from 2022 to 2024, I led machining and fabrication for a 40-member team, helped design the robot's autonomous pathing and decision making, and ran workshops for newer members. The team reached the FRC World Championship two years running and finished with a Top 5% international ranking, winning the Quality Award three times, the Autonomous Award four times, and the Industrial Award.",
    tech: ["CNC machining", "CAD", "Autonomous programming"],
    outcome: {
      metric: "Top 5%",
      label:
        "international ranking, with back-to-back World Championship appearances",
    },
  },
  {
    title: "Course Scheduling Platform",
    video: "/projects/courseflow-demo.mp4",
    image: "/projects/courseflow-demo.jpg",
    secondVideo: {
      src: "/projects/courseflow-how-it-works.mp4",
      poster: "/projects/courseflow-how-it-works.jpg",
      caption:
        "How it works: the sorted queue, linked tables, login checks and calendar filter.",
    },
    figureCaption:
      "A teacher sets an assignment, and it appears on the student's calendar.",
    figureBrief:
      "Screenshot of the student calendar view, or an entity-relationship diagram of the SQL schema.",
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
