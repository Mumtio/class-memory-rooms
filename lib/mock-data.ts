// Mock database for Class Memory Rooms

export interface School {
  id: string
  name: string
}

export interface Subject {
  id: string
  name: string
  colorTag: string
  courseCount: number
  chapterCount: number
  compiledCount: number
  collectingCount: number
}

export interface Course {
  id: string
  subjectId: string
  code: string
  title: string
  teacher: string
  term: string
  section: string
}

export interface Chapter {
  id: string
  courseId: string
  label: string
  title: string
  date?: string
  status: "Collecting" | "AI Ready" | "Compiled"
  contributions: number
  resources: number
  photos: number
}

export type ContributionType = "takeaway" | "notes_photo" | "resource" | "solved_example" | "confusion"

export interface Contribution {
  id: string
  chapterId: string
  type: ContributionType
  title?: string
  content?: string
  anonymous: boolean
  authorName: string
  createdAt: string
  link?: { url: string; title: string }
  image?: { alt: string }
  replies?: Array<{ id: string; author: string; content: string; createdAt: string; anonymous?: boolean }>
  helpfulCount: number
}

export interface NoteStackItem {
  id: string
  chapterId: string
  label: string
  marker: string
  title: string
  kind: "resource" | "top_explanation" | "solved_example" | "confusion" | "ai_note_preview"
  targetContributionId?: string
}

export type UnifiedNotes = {
  id: string
  chapterId: string
  version: number
  generatedAt: string
  overview: string[]
  keyConcepts: Array<{ title: string; explanation: string }>
  definitions: Array<{ term: string; meaning: string }>
  formulas: Array<{ formula: string; meaning: string; note?: string }>
  steps: string[]
  examples: Array<{ title: string; steps: string[]; answer: string }>
  mistakes: string[]
  resources: Array<{ title: string; url: string; why: string }>
  bestNotePhotos: Array<{ alt: string }>
  quickRevision: string[]
}

export const school: School = {
  id: "demo",
  name: "Demo High School",
}

export const subjects: Subject[] = [
  {
    id: "phy",
    name: "Physics",
    colorTag: "#7EC8E3",
    courseCount: 3,
    chapterCount: 18,
    compiledCount: 12,
    collectingCount: 6,
  },
  {
    id: "math",
    name: "Mathematics",
    colorTag: "#FFE45C",
    courseCount: 2,
    chapterCount: 14,
    compiledCount: 10,
    collectingCount: 4,
  },
  {
    id: "cse",
    name: "Computer Science",
    colorTag: "#D6FF3F",
    courseCount: 2,
    chapterCount: 16,
    compiledCount: 8,
    collectingCount: 8,
  },
  {
    id: "chem",
    name: "Chemistry",
    colorTag: "#FF6B6B",
    courseCount: 2,
    chapterCount: 12,
    compiledCount: 7,
    collectingCount: 5,
  },
]

export const courses: Course[] = [
  {
    id: "phy-101",
    subjectId: "phy",
    code: "PHY-101",
    title: "Mechanics I",
    teacher: "Ms. Farzana Ahmed",
    term: "Fall 2025",
    section: "A",
  },
  {
    id: "phy-102",
    subjectId: "phy",
    code: "PHY-102",
    title: "Waves & Optics",
    teacher: "Mr. Arif Rahman",
    term: "Fall 2025",
    section: "B",
  },
  {
    id: "phy-201",
    subjectId: "phy",
    code: "PHY-201",
    title: "Electromagnetism",
    teacher: "Dr. Kamal Hossain",
    term: "Fall 2025",
    section: "A",
  },

  {
    id: "math-201",
    subjectId: "math",
    code: "MATH-201",
    title: "Calculus II",
    teacher: "Dr. Nabila Khan",
    term: "Fall 2025",
    section: "A",
  },
  {
    id: "math-301",
    subjectId: "math",
    code: "MATH-301",
    title: "Linear Algebra",
    teacher: "Prof. Sadiq Ali",
    term: "Fall 2025",
    section: "B",
  },

  {
    id: "cse-110",
    subjectId: "cse",
    code: "CSE-110",
    title: "Intro to Programming",
    teacher: "Mr. Kabir Hassan",
    term: "Fall 2025",
    section: "A",
  },
  {
    id: "cse-220",
    subjectId: "cse",
    code: "CSE-220",
    title: "Data Structures",
    teacher: "Ms. Rukhsar Begum",
    term: "Fall 2025",
    section: "B",
  },

  {
    id: "chem-121",
    subjectId: "chem",
    code: "CHEM-121",
    title: "Organic Chemistry I",
    teacher: "Ms. Tania Sultana",
    term: "Fall 2025",
    section: "A",
  },
  {
    id: "chem-221",
    subjectId: "chem",
    code: "CHEM-221",
    title: "Physical Chemistry",
    teacher: "Dr. Rafiq Ahmed",
    term: "Fall 2025",
    section: "C",
  },
]

export const chapters: Chapter[] = [
  // PHY-101 Chapters
  {
    id: "ch-phy-101-01",
    courseId: "phy-101",
    label: "Lec 01",
    title: "Vectors & Scalars",
    date: "Sep 5",
    status: "Compiled",
    contributions: 24,
    resources: 6,
    photos: 9,
  },
  {
    id: "ch-phy-101-02",
    courseId: "phy-101",
    label: "Lec 02",
    title: "Newton's Laws",
    date: "Sep 8",
    status: "Compiled",
    contributions: 22,
    resources: 5,
    photos: 8,
  },
  {
    id: "ch-phy-101-03",
    courseId: "phy-101",
    label: "Lec 03",
    title: "Friction & Inclines",
    date: "Sep 12",
    status: "AI Ready",
    contributions: 18,
    resources: 4,
    photos: 7,
  },
  {
    id: "ch-phy-101-04",
    courseId: "phy-101",
    label: "Lec 04",
    title: "Work & Energy",
    date: "Sep 15",
    status: "AI Ready",
    contributions: 16,
    resources: 3,
    photos: 6,
  },
  {
    id: "ch-phy-101-05",
    courseId: "phy-101",
    label: "Lec 05",
    title: "Momentum & Collisions",
    date: "Sep 19",
    status: "Collecting",
    contributions: 7,
    resources: 2,
    photos: 3,
  },
  {
    id: "ch-phy-101-06",
    courseId: "phy-101",
    label: "Lec 06",
    title: "Rotational Motion",
    date: "Sep 22",
    status: "Collecting",
    contributions: 5,
    resources: 1,
    photos: 2,
  },

  // PHY-102 Chapters
  {
    id: "ch-phy-102-01",
    courseId: "phy-102",
    label: "Lec 01",
    title: "Wave Properties",
    date: "Sep 6",
    status: "Compiled",
    contributions: 20,
    resources: 5,
    photos: 7,
  },
  {
    id: "ch-phy-102-02",
    courseId: "phy-102",
    label: "Lec 02",
    title: "Sound Waves",
    date: "Sep 9",
    status: "Compiled",
    contributions: 19,
    resources: 4,
    photos: 6,
  },
  {
    id: "ch-phy-102-03",
    courseId: "phy-102",
    label: "Lec 03",
    title: "Light & Reflection",
    date: "Sep 13",
    status: "AI Ready",
    contributions: 15,
    resources: 3,
    photos: 5,
  },
  {
    id: "ch-phy-102-04",
    courseId: "phy-102",
    label: "Lec 04",
    title: "Refraction & Lenses",
    date: "Sep 16",
    status: "Collecting",
    contributions: 8,
    resources: 2,
    photos: 3,
  },

  // PHY-201 Chapters
  {
    id: "ch-phy-201-01",
    courseId: "phy-201",
    label: "Lec 01",
    title: "Electric Fields",
    date: "Sep 7",
    status: "Compiled",
    contributions: 21,
    resources: 6,
    photos: 8,
  },
  {
    id: "ch-phy-201-02",
    courseId: "phy-201",
    label: "Lec 02",
    title: "Gauss Law",
    date: "Sep 10",
    status: "AI Ready",
    contributions: 17,
    resources: 4,
    photos: 6,
  },
  {
    id: "ch-phy-201-03",
    courseId: "phy-201",
    label: "Lec 03",
    title: "Electric Potential",
    date: "Sep 14",
    status: "Collecting",
    contributions: 9,
    resources: 2,
    photos: 4,
  },

  // MATH-201 Chapters
  {
    id: "ch-math-201-01",
    courseId: "math-201",
    label: "Lec 01",
    title: "Integration Techniques",
    date: "Sep 5",
    status: "Compiled",
    contributions: 26,
    resources: 7,
    photos: 10,
  },
  {
    id: "ch-math-201-02",
    courseId: "math-201",
    label: "Lec 02",
    title: "Series & Sequences",
    date: "Sep 8",
    status: "Compiled",
    contributions: 24,
    resources: 6,
    photos: 9,
  },
  {
    id: "ch-math-201-03",
    courseId: "math-201",
    label: "Lec 03",
    title: "Parametric Equations",
    date: "Sep 12",
    status: "AI Ready",
    contributions: 19,
    resources: 5,
    photos: 7,
  },
  {
    id: "ch-math-201-04",
    courseId: "math-201",
    label: "Lec 04",
    title: "Polar Coordinates",
    date: "Sep 15",
    status: "Collecting",
    contributions: 11,
    resources: 3,
    photos: 5,
  },

  // MATH-301 Chapters
  {
    id: "ch-math-301-01",
    courseId: "math-301",
    label: "Lec 01",
    title: "Vector Spaces",
    date: "Sep 6",
    status: "Compiled",
    contributions: 22,
    resources: 6,
    photos: 8,
  },
  {
    id: "ch-math-301-02",
    courseId: "math-301",
    label: "Lec 02",
    title: "Linear Transformations",
    date: "Sep 9",
    status: "AI Ready",
    contributions: 18,
    resources: 4,
    photos: 6,
  },
  {
    id: "ch-math-301-03",
    courseId: "math-301",
    label: "Lec 03",
    title: "Eigenvalues",
    date: "Sep 13",
    status: "Collecting",
    contributions: 10,
    resources: 2,
    photos: 4,
  },

  // CSE-110 Chapters
  {
    id: "ch-cse-110-01",
    courseId: "cse-110",
    label: "Lec 01",
    title: "Intro to Python",
    date: "Sep 5",
    status: "Compiled",
    contributions: 28,
    resources: 8,
    photos: 11,
  },
  {
    id: "ch-cse-110-02",
    courseId: "cse-110",
    label: "Lec 02",
    title: "Variables & Data Types",
    date: "Sep 8",
    status: "Compiled",
    contributions: 25,
    resources: 7,
    photos: 10,
  },
  {
    id: "ch-cse-110-03",
    courseId: "cse-110",
    label: "Lec 03",
    title: "Control Flow",
    date: "Sep 12",
    status: "AI Ready",
    contributions: 20,
    resources: 5,
    photos: 8,
  },
  {
    id: "ch-cse-110-04",
    courseId: "cse-110",
    label: "Lec 04",
    title: "Functions",
    date: "Sep 15",
    status: "Collecting",
    contributions: 12,
    resources: 3,
    photos: 5,
  },

  // CSE-220 Chapters
  {
    id: "ch-cse-220-01",
    courseId: "cse-220",
    label: "Lec 01",
    title: "Arrays & Lists",
    date: "Sep 6",
    status: "Compiled",
    contributions: 23,
    resources: 6,
    photos: 9,
  },
  {
    id: "ch-cse-220-02",
    courseId: "cse-220",
    label: "Lec 02",
    title: "Stacks & Queues",
    date: "Sep 9",
    status: "AI Ready",
    contributions: 19,
    resources: 5,
    photos: 7,
  },
  {
    id: "ch-cse-220-03",
    courseId: "cse-220",
    label: "Lec 03",
    title: "Linked Lists",
    date: "Sep 13",
    status: "Collecting",
    contributions: 13,
    resources: 3,
    photos: 6,
  },

  // CHEM-121 Chapters
  {
    id: "ch-chem-121-01",
    courseId: "chem-121",
    label: "Lec 01",
    title: "Hydrocarbons",
    date: "Sep 5",
    status: "Compiled",
    contributions: 21,
    resources: 6,
    photos: 8,
  },
  {
    id: "ch-chem-121-02",
    courseId: "chem-121",
    label: "Lec 02",
    title: "Functional Groups",
    date: "Sep 8",
    status: "Compiled",
    contributions: 20,
    resources: 5,
    photos: 7,
  },
  {
    id: "ch-chem-121-03",
    courseId: "chem-121",
    label: "Lec 03",
    title: "Isomerism",
    date: "Sep 12",
    status: "AI Ready",
    contributions: 16,
    resources: 4,
    photos: 6,
  },
  {
    id: "ch-chem-121-04",
    courseId: "chem-121",
    label: "Lec 04",
    title: "Reaction Mechanisms",
    date: "Sep 15",
    status: "Collecting",
    contributions: 9,
    resources: 2,
    photos: 4,
  },

  // CHEM-221 Chapters
  {
    id: "ch-chem-221-01",
    courseId: "chem-221",
    label: "Lec 01",
    title: "Thermodynamics Basics",
    date: "Sep 6",
    status: "Compiled",
    contributions: 19,
    resources: 5,
    photos: 7,
  },
  {
    id: "ch-chem-221-02",
    courseId: "chem-221",
    label: "Lec 02",
    title: "Chemical Kinetics",
    date: "Sep 9",
    status: "AI Ready",
    contributions: 15,
    resources: 4,
    photos: 5,
  },
  {
    id: "ch-chem-221-03",
    courseId: "chem-221",
    label: "Lec 03",
    title: "Quantum Chemistry",
    date: "Sep 13",
    status: "Collecting",
    contributions: 8,
    resources: 2,
    photos: 3,
  },
]

export const contributionsByChapter: Record<string, Contribution[]> = {
  "ch-phy-101-01": [
    {
      id: "cont-001",
      chapterId: "ch-phy-101-01",
      type: "takeaway",
      title: "Vector vs Scalar Key Difference",
      content:
        "Vectors have both magnitude AND direction (like velocity, force). Scalars only have magnitude (like speed, mass). That's the core difference Ms. Farzana emphasized!",
      anonymous: false,
      authorName: "Sarah K.",
      createdAt: "2h ago",
      helpfulCount: 18,
      replies: [
        {
          id: "rep-001",
          author: "Mike R.",
          content: "Thanks! This helped me understand why displacement is a vector but distance isn't.",
          createdAt: "1h ago",
        },
      ],
    },
    {
      id: "cont-002",
      chapterId: "ch-phy-101-01",
      type: "resource",
      title: "Khan Academy Vector Basics",
      content: "Really good visual explanation of vector addition. The animations make it click.",
      link: {
        url: "https://khanacademy.org/physics/vectors",
        title: "Vector Addition - Khan Academy",
      },
      anonymous: false,
      authorName: "James L.",
      createdAt: "3h ago",
      helpfulCount: 15,
    },
    {
      id: "cont-003",
      chapterId: "ch-phy-101-01",
      type: "solved_example",
      title: "Problem 2.3 from textbook",
      content:
        "A person walks 3km east, then 4km north. Find displacement.\n\nSolution: Use Pythagorean theorem!\nDisplacement = √(3² + 4²) = √25 = 5km\nDirection = tan⁻¹(4/3) = 53° north of east",
      anonymous: false,
      authorName: "Priya M.",
      createdAt: "4h ago",
      helpfulCount: 22,
      replies: [
        {
          id: "rep-002",
          author: "David C.",
          content: "This is exactly what I was stuck on. Thank you!",
          createdAt: "3h ago",
        },
        {
          id: "rep-003",
          author: "Anonymous Student",
          anonymous: true,
          content: "Why do we use tan inverse here?",
          createdAt: "2h ago",
        },
      ],
    },
    {
      id: "cont-004",
      chapterId: "ch-phy-101-01",
      type: "confusion",
      title: "When do we use component method vs graphical?",
      content:
        "I get that both work for vector addition but when should we choose one over the other? The graphical method seems easier but my answers don't match the textbook.",
      anonymous: false,
      authorName: "Alex T.",
      createdAt: "5h ago",
      helpfulCount: 12,
      replies: [
        {
          id: "rep-004",
          author: "Priya M.",
          content:
            "Component method is more accurate! Graphical is good for quick estimates. For homework always use components.",
          createdAt: "4h ago",
        },
      ],
    },
    {
      id: "cont-005",
      chapterId: "ch-phy-101-01",
      type: "notes_photo",
      title: "Board notes from today's class",
      content: "Ms. Farzana's diagram showing vector addition using parallelogram law. Super helpful!",
      image: { alt: "Whiteboard showing vector parallelogram method" },
      anonymous: false,
      authorName: "Nina P.",
      createdAt: "6h ago",
      helpfulCount: 25,
    },
    {
      id: "cont-006",
      chapterId: "ch-phy-101-01",
      type: "takeaway",
      content:
        "Unit vectors (î, ĵ, k̂) are like the building blocks. Any vector can be written as a combination of these three directions!",
      anonymous: false,
      authorName: "Omar F.",
      createdAt: "6h ago",
      helpfulCount: 14,
    },
    {
      id: "cont-007",
      chapterId: "ch-phy-101-01",
      type: "resource",
      title: "Vector Simulator Tool",
      content: "Interactive tool to practice vector addition. You can drag vectors and see the resultant in real-time.",
      link: {
        url: "https://phet.colorado.edu/en/simulation/vector-addition",
        title: "PhET Vector Addition Simulator",
      },
      anonymous: false,
      authorName: "Chris W.",
      createdAt: "7h ago",
      helpfulCount: 19,
    },
    {
      id: "cont-008",
      chapterId: "ch-phy-101-01",
      type: "solved_example",
      title: "Resolving a force vector",
      content:
        "Given: Force F = 50N at 30° to horizontal\nFind: Horizontal and vertical components\n\nFₓ = F cos(30°) = 50 × 0.866 = 43.3N\nFᵧ = F sin(30°) = 50 × 0.5 = 25N",
      anonymous: false,
      authorName: "Maya S.",
      createdAt: "8h ago",
      helpfulCount: 17,
    },
    {
      id: "cont-009",
      chapterId: "ch-phy-101-01",
      type: "takeaway",
      title: "Dot product vs Cross product",
      content:
        "Dot product gives a SCALAR (A·B = |A||B|cosθ)\nCross product gives a VECTOR (A×B perpendicular to both)\nRemember: dot for work, cross for torque!",
      anonymous: false,
      authorName: "Rachel B.",
      createdAt: "9h ago",
      helpfulCount: 21,
    },
    {
      id: "cont-010",
      chapterId: "ch-phy-101-01",
      type: "confusion",
      content:
        "Why is the magnitude of a vector always positive? Even if all components are negative, the magnitude comes out positive. Is this just a rule?",
      anonymous: true,
      authorName: "Anonymous Student",
      createdAt: "10h ago",
      helpfulCount: 9,
      replies: [
        {
          id: "rep-005",
          author: "Omar F.",
          content:
            "Magnitude is like distance - it's always positive! The direction is what tells you where it points. Think of it as 'how much' vs 'which way'.",
          createdAt: "9h ago",
        },
      ],
    },
    {
      id: "cont-011",
      chapterId: "ch-phy-101-01",
      type: "notes_photo",
      title: "My summary sheet",
      content: "Made a one-page summary of all vector operations with formulas",
      image: { alt: "Hand-written summary sheet for vectors" },
      anonymous: false,
      authorName: "Lisa H.",
      createdAt: "11h ago",
      helpfulCount: 28,
    },
    {
      id: "cont-012",
      chapterId: "ch-phy-101-01",
      type: "takeaway",
      content:
        "Tip from class: Always draw a diagram first! Even for problems that seem algebraic. Visualizing the vectors helps avoid sign mistakes.",
      anonymous: false,
      authorName: "Kevin D.",
      createdAt: "12h ago",
      helpfulCount: 16,
    },
    {
      id: "cont-013",
      chapterId: "ch-phy-101-01",
      type: "resource",
      title: "Prof Leonard's YouTube series",
      content: "His vector calculus intro is amazing. Goes slow and explains every step.",
      link: {
        url: "https://youtube.com/watch?v=vectorcalc",
        title: "Vector Calculus - Prof Leonard",
      },
      anonymous: false,
      authorName: "Anonymous Student",
      anonymous: true,
      createdAt: "13h ago",
      helpfulCount: 11,
    },
    {
      id: "cont-014",
      chapterId: "ch-phy-101-01",
      type: "solved_example",
      title: "Relative velocity problem",
      content:
        "Boat crossing river:\nBoat speed in still water = 5 m/s\nRiver current = 3 m/s\nFind: Resultant velocity\n\nv_resultant = √(5² + 3²) = √34 = 5.83 m/s\nAngle = tan⁻¹(3/5) = 31°",
      anonymous: false,
      authorName: "Tom J.",
      createdAt: "14h ago",
      helpfulCount: 13,
    },
    {
      id: "cont-015",
      chapterId: "ch-phy-101-01",
      type: "confusion",
      title: "Negative vectors??",
      content: "What does -A mean? Is it the same vector going backwards? Or is it something else?",
      anonymous: false,
      authorName: "Emma R.",
      createdAt: "15h ago",
      helpfulCount: 8,
      replies: [
        {
          id: "rep-006",
          author: "Sarah K.",
          content: "Yes! -A is the same magnitude but opposite direction. Like if A points north, -A points south.",
          createdAt: "14h ago",
        },
      ],
    },
    {
      id: "cont-016",
      chapterId: "ch-phy-101-01",
      type: "notes_photo",
      title: "Vector addition diagrams",
      content: "Drew all 3 methods: triangle, parallelogram, and component",
      image: { alt: "Three vector addition methods illustrated" },
      anonymous: false,
      authorName: "Carlos M.",
      createdAt: "16h ago",
      helpfulCount: 23,
    },
    {
      id: "cont-017",
      chapterId: "ch-phy-101-01",
      type: "takeaway",
      content:
        "Position vector tells where you ARE. Displacement vector tells how you MOVED. Not the same thing unless you started at origin!",
      anonymous: false,
      authorName: "Zara A.",
      createdAt: "17h ago",
      helpfulCount: 15,
    },
    {
      id: "cont-018",
      chapterId: "ch-phy-101-01",
      type: "solved_example",
      title: "Projectile motion setup",
      content:
        "Initial velocity v₀ = 20 m/s at 45°\n\nBreak into components:\nv₀ₓ = 20 cos(45°) = 14.14 m/s\nv₀ᵧ = 20 sin(45°) = 14.14 m/s\n\nThese stay constant (x) and change (y) during flight!",
      anonymous: false,
      authorName: "Aisha K.",
      createdAt: "18h ago",
      helpfulCount: 19,
    },
    {
      id: "cont-019",
      chapterId: "ch-phy-101-01",
      type: "resource",
      title: "Textbook PDF chapter 2",
      content: "Found a free PDF of Halliday Resnick chapter 2. DM me if you need it.",
      anonymous: true,
      authorName: "Anonymous Student",
      createdAt: "19h ago",
      helpfulCount: 7,
    },
    {
      id: "cont-020",
      chapterId: "ch-phy-101-01",
      type: "confusion",
      content: "In 3D vector problems, how do I know when to use k̂ (z-component)? Most examples only use x and y...",
      anonymous: false,
      authorName: "Ben L.",
      createdAt: "20h ago",
      helpfulCount: 10,
    },
    {
      id: "cont-021",
      chapterId: "ch-phy-101-01",
      type: "takeaway",
      content:
        "Remember: vectors can't be divided! You can multiply by scalars, dot product with vectors, or cross product. But NEVER division.",
      anonymous: false,
      authorName: "Sophie N.",
      createdAt: "21h ago",
      helpfulCount: 14,
    },
    {
      id: "cont-022",
      chapterId: "ch-phy-101-01",
      type: "notes_photo",
      title: "Practice problems I solved",
      content: "All 15 problems from homework with solutions",
      image: { alt: "Solved homework problems" },
      anonymous: false,
      authorName: "Jordan P.",
      createdAt: "22h ago",
      helpfulCount: 31,
    },
    {
      id: "cont-023",
      chapterId: "ch-phy-101-01",
      type: "solved_example",
      title: "Vector subtraction explained",
      content:
        "To find A - B:\nMethod 1: Add A + (-B)\nMethod 2: Components: (Aₓ - Bₓ)î + (Aᵧ - Bᵧ)ĵ\n\nBoth give same answer! I prefer method 2.",
      anonymous: false,
      authorName: "Mira T.",
      createdAt: "23h ago",
      helpfulCount: 12,
    },
    {
      id: "cont-024",
      chapterId: "ch-phy-101-01",
      type: "takeaway",
      content:
        "For exam: Know how to convert between magnitude-angle form and component form in both directions. This came up 3 times on last year's midterm!",
      anonymous: false,
      authorName: "Tyler G.",
      createdAt: "1d ago",
      helpfulCount: 27,
    },
  ],
}

export const noteStackByChapter: Record<string, NoteStackItem[]> = {
  "ch-phy-101-01": [
    {
      id: "stack-001",
      chapterId: "ch-phy-101-01",
      label: "001",
      marker: "R",
      title: "Khan Academy Vectors",
      kind: "resource",
      targetContributionId: "cont-002",
    },
    {
      id: "stack-002",
      chapterId: "ch-phy-101-01",
      label: "002",
      marker: "R",
      title: "PhET Simulator",
      kind: "resource",
      targetContributionId: "cont-007",
    },
    {
      id: "stack-003",
      chapterId: "ch-phy-101-01",
      label: "003",
      marker: "N",
      title: "Vector vs Scalar Difference",
      kind: "top_explanation",
      targetContributionId: "cont-001",
    },
    {
      id: "stack-004",
      chapterId: "ch-phy-101-01",
      label: "004",
      marker: "E",
      title: "Displacement Problem 2.3",
      kind: "solved_example",
      targetContributionId: "cont-003",
    },
    {
      id: "stack-005",
      chapterId: "ch-phy-101-01",
      label: "005",
      marker: "E",
      title: "Force Components",
      kind: "solved_example",
      targetContributionId: "cont-008",
    },
    {
      id: "stack-006",
      chapterId: "ch-phy-101-01",
      label: "006",
      marker: "Q",
      title: "Component vs Graphical Method",
      kind: "confusion",
      targetContributionId: "cont-004",
    },
    {
      id: "stack-007",
      chapterId: "ch-phy-101-01",
      label: "007",
      marker: "P",
      title: "Complete Homework Solutions",
      kind: "resource",
      targetContributionId: "cont-022",
    },
    {
      id: "stack-008",
      chapterId: "ch-phy-101-01",
      label: "AI",
      marker: "✨",
      title: "AI Study Guide Ready",
      kind: "ai_note_preview",
    },
  ],
}

export const unifiedNotesByChapter: Record<string, UnifiedNotes[]> = {
  "ch-phy-101-01": [
    {
      id: "notes-v1-ch-phy-101-01",
      chapterId: "ch-phy-101-01",
      version: 1,
      generatedAt: "2 days ago",
      overview: [
        "Vectors have both magnitude and direction while scalars only have magnitude",
        "Vector operations include addition (tip-to-tail method), subtraction, and scalar multiplication",
        "Vectors can be resolved into components using trigonometry",
        "Unit vectors (î, ĵ, k̂) provide a standardized way to express any vector",
        "Common vector quantities: displacement, velocity, acceleration, force",
        "Common scalar quantities: distance, speed, mass, temperature, energy",
      ],
      keyConcepts: [
        {
          title: "Magnitude vs Direction",
          explanation:
            "Magnitude is the size or amount (always positive). Direction specifies orientation in space using angles or unit vectors.",
        },
        {
          title: "Vector Representation",
          explanation:
            "Vectors can be shown as arrows (graphical), component form (Ax, Ay), or using unit vectors (Aî + Bĵ).",
        },
        {
          title: "Resultant Vector",
          explanation:
            "The single vector that produces the same effect as multiple vectors acting together. Found through vector addition.",
        },
        {
          title: "Vector Components",
          explanation:
            "Breaking a vector into perpendicular parts (usually x and y). Essential for calculations and adding non-parallel vectors.",
        },
        {
          title: "Position vs Displacement",
          explanation:
            "Position vector points from origin to a location. Displacement vector shows change in position between two points.",
        },
        {
          title: "Dot Product",
          explanation:
            "Scalar result from multiplying vectors: A·B = |A||B|cosθ. Used to find work, angles between vectors.",
        },
        {
          title: "Cross Product",
          explanation:
            "Vector result perpendicular to both input vectors: A×B. Magnitude = |A||B|sinθ. Used for torque, angular momentum.",
        },
        {
          title: "Unit Vectors",
          explanation:
            "Vectors with magnitude = 1 that indicate direction only. î, ĵ, k̂ point along x, y, z axes respectively.",
        },
      ],
      definitions: [
        {
          term: "Vector",
          meaning: "A quantity with both magnitude and direction (e.g., velocity, force, displacement)",
        },
        { term: "Scalar", meaning: "A quantity with magnitude only, no direction (e.g., mass, speed, temperature)" },
        { term: "Magnitude", meaning: "The size or length of a vector, denoted as |A| or A, always positive" },
        {
          term: "Unit Vector",
          meaning: "A vector with magnitude 1, used to specify direction: î (x-axis), ĵ (y-axis), k̂ (z-axis)",
        },
        { term: "Components", meaning: "The perpendicular parts of a vector: Ax = Acosθ, Ay = Asinθ" },
        { term: "Resultant", meaning: "The single vector equivalent to the combined effect of multiple vectors" },
        { term: "Position Vector", meaning: "Vector from origin to a point in space, describes location" },
        {
          term: "Displacement Vector",
          meaning: "Vector representing change in position, from initial to final location",
        },
        { term: "Dot Product (A·B)", meaning: "Scalar result = |A||B|cosθ, measures how much vectors align" },
        { term: "Cross Product (A×B)", meaning: "Vector perpendicular to both A and B, magnitude = |A||B|sinθ" },
      ],
      formulas: [
        { formula: "|A| = √(Ax² + Ay²)", meaning: "Magnitude of vector A in 2D using Pythagorean theorem" },
        { formula: "|A| = √(Ax² + Ay² + Az²)", meaning: "Magnitude of vector A in 3D space" },
        {
          formula: "Ax = A cosθ, Ay = A sinθ",
          meaning: "Component form of vector A at angle θ from x-axis",
          note: "θ measured counterclockwise from positive x-axis",
        },
        {
          formula: "θ = tan⁻¹(Ay/Ax)",
          meaning: "Angle of vector from x-axis",
          note: "Check quadrant to get correct angle",
        },
        { formula: "R = A + B", meaning: "Resultant vector R from adding vectors A and B" },
        { formula: "â = A/|A|", meaning: "Unit vector in direction of A" },
        { formula: "A·B = AxBx + AyBy + AzBz", meaning: "Dot product in component form" },
        { formula: "A·B = |A||B|cosθ", meaning: "Dot product using magnitudes and angle between vectors" },
        {
          formula: "|A×B| = |A||B|sinθ",
          meaning: "Magnitude of cross product",
          note: "Direction given by right-hand rule",
        },
      ],
      steps: [
        "Identify whether each quantity is a vector (has direction) or scalar (magnitude only)",
        "Draw a diagram showing all vectors with proper orientation and labels",
        "Choose a coordinate system (usually x-y with standard orientation)",
        "Break each vector into x and y components using trigonometry: Ax = Acosθ, Ay = Asinθ",
        "Add all x-components together to get Rx, add all y-components to get Ry",
        "Calculate resultant magnitude: R = √(Rx² + Ry²)",
        "Find resultant direction: θ = tan⁻¹(Ry/Rx), checking the correct quadrant",
        "Verify your answer makes physical sense and units are consistent",
      ],
      examples: [
        {
          title: "Example 1: Adding Two Perpendicular Vectors",
          steps: [
            "Given: Vector A = 3 m East, Vector B = 4 m North",
            "Since perpendicular, can use Pythagorean theorem directly",
            "Magnitude: R = √(3² + 4²) = √(9 + 16) = √25 = 5 m",
            "Direction: θ = tan⁻¹(4/3) = tan⁻¹(1.33) = 53.1° North of East",
          ],
          answer: "Resultant = 5 m at 53.1° North of East",
        },
        {
          title: "Example 2: Resolving a Force Vector",
          steps: [
            "Given: Force F = 50 N at 30° above horizontal",
            "Find components: Fx = F cosθ = 50 × cos(30°) = 50 × 0.866 = 43.3 N",
            "Fy = F sinθ = 50 × sin(30°) = 50 × 0.5 = 25 N",
            "Verify: |F| = √(43.3² + 25²) = √(1875 + 625) = √2500 = 50 N ✓",
          ],
          answer: "Fx = 43.3 N (horizontal), Fy = 25 N (vertical)",
        },
        {
          title: "Example 3: Vector Subtraction",
          steps: [
            "Given: A = 5î + 3ĵ, B = 2î + 7ĵ. Find A - B",
            "A - B = (5-2)î + (3-7)ĵ = 3î - 4ĵ",
            "Magnitude: |A-B| = √(3² + (-4)²) = √(9 + 16) = 5",
            "Direction: θ = tan⁻¹(-4/3) = -53.1° (below positive x-axis)",
          ],
          answer: "A - B = 3î - 4ĵ, magnitude = 5, direction = 53.1° below x-axis",
        },
        {
          title: "Example 4: Dot Product Application",
          steps: [
            "Given: A = 6î + 8ĵ, B = 3î + 4ĵ. Find angle between them",
            "A·B = (6)(3) + (8)(4) = 18 + 32 = 50",
            "|A| = √(36+64) = 10, |B| = √(9+16) = 5",
            "A·B = |A||B|cosθ → 50 = (10)(5)cosθ → cosθ = 1 → θ = 0°",
          ],
          answer: "Angle = 0° (vectors are parallel)",
        },
      ],
      mistakes: [
        "Forgetting that scalars cannot be added to vectors - they're different types of quantities",
        "Using speed instead of velocity in vector calculations (speed has no direction)",
        "Adding vector magnitudes instead of adding vectors properly (you must consider direction!)",
        "Wrong quadrant for angle - always check where your vector actually points on a diagram",
        "Confusing distance (scalar) with displacement (vector) - distance is path length, displacement is straight-line change",
        "Using degrees when calculator is in radians mode (or vice versa) for trig functions",
        "Negative magnitudes - magnitude is always positive. Negative sign indicates opposite direction",
        "Forgetting to break vectors into components before adding non-parallel vectors",
        "Mixing up dot product (gives scalar) and cross product (gives vector)",
        "Not checking units - all vectors being added must have same units",
      ],
      resources: [
        {
          title: "Khan Academy - Vector Basics",
          url: "https://khanacademy.org/physics/vectors",
          why: "Excellent visual animations showing vector addition and components. Great for building intuition.",
        },
        {
          title: "PhET Vector Addition Simulation",
          url: "https://phet.colorado.edu/en/simulation/vector-addition",
          why: "Interactive tool to practice adding vectors. Drag vectors around and see resultant in real-time.",
        },
        {
          title: "MIT OCW Physics I Vectors Lecture",
          url: "https://ocw.mit.edu/courses/physics/8-01/lecture-vectors",
          why: "Detailed lecture with examples from Walter Lewin. More advanced but very thorough.",
        },
        {
          title: "Prof Leonard - Vector Calculus Intro",
          url: "https://youtube.com/watch?v=vectorcalc",
          why: "Goes slow and explains every step clearly. Perfect if you need extra explanation.",
        },
        {
          title: "Paul's Online Math Notes - Vectors",
          url: "https://tutorial.math.lamar.edu/classes/calcii/vectors.aspx",
          why: "Clean written notes with lots of worked examples. Good for review.",
        },
        {
          title: "Textbook: Young & Freedman Chapter 1.7-1.10",
          url: "https://library.com/young-freedman",
          why: "Official course textbook section on vectors. Has practice problems with solutions.",
        },
      ],
      bestNotePhotos: [
        { alt: "Whiteboard diagram showing parallelogram method for vector addition" },
        { alt: "Hand-written summary sheet with all vector formulas and unit vectors" },
        { alt: "Detailed worked example of projectile motion vector decomposition" },
      ],
      quickRevision: [
        "Vector = magnitude + direction. Scalar = magnitude only",
        "Always draw a diagram first!",
        "Components: Ax = Acosθ, Ay = Asinθ (θ from x-axis)",
        "Magnitude: |A| = √(Ax² + Ay²)",
        "Direction: θ = tan⁻¹(Ay/Ax), check quadrant",
        "Add vectors: Add all x-components, add all y-components separately",
        "Unit vectors: î (x), ĵ (y), k̂ (z). Each has magnitude = 1",
        "A·B (dot) = scalar = |A||B|cosθ. Used for work.",
        "A×B (cross) = vector ⊥ to both. Magnitude = |A||B|sinθ. Used for torque.",
        "Position vector: from origin to point. Displacement: change in position.",
        "Negative vector -A: same magnitude, opposite direction",
        "Unit vector: â = A/|A|",
        "Zero vector has magnitude 0 and no specific direction",
        "Commutative: A+B = B+A. Dot: A·B = B·A. Cross: A×B = -(B×A)",
        "Check units! All vectors being added must have same units.",
      ],
    },
    {
      id: "notes-v2-ch-phy-101-01",
      chapterId: "ch-phy-101-01",
      version: 2,
      generatedAt: "4 hours ago",
      overview: [
        "Vectors possess both magnitude and direction, distinguishing them from scalars which have magnitude only",
        "Vector operations include graphical methods (tip-to-tail, parallelogram) and analytical component methods",
        "Any vector can be decomposed into perpendicular components using trigonometric relationships",
        "Standard unit vectors (î, ĵ, k̂) form an orthonormal basis for 3D space",
        "Physical vector quantities: displacement, velocity, acceleration, force, momentum",
        "Physical scalar quantities: distance, speed, mass, time, temperature, energy, work",
      ],
      keyConcepts: [
        {
          title: "Vector vs Scalar Distinction",
          explanation:
            "Vectors transform under coordinate rotations, maintaining direction and magnitude. Scalars remain invariant. This is the fundamental physical difference.",
        },
        {
          title: "Vector Representations",
          explanation:
            "Three common forms: geometric (arrow), component (ordered tuple), unit vector notation (linear combination of î, ĵ, k̂).",
        },
        {
          title: "Resultant and Equilibrium",
          explanation:
            "Resultant is net effect of multiple vectors. When resultant = 0, system is in equilibrium (Newton's First Law).",
        },
        {
          title: "Component Resolution",
          explanation:
            "Project vector onto coordinate axes. Allows vector addition without graphical methods. Essential for all physics calculations.",
        },
        {
          title: "Position and Displacement",
          explanation:
            "Position is absolute location from origin. Displacement is path-independent change: Δr = r_final - r_initial.",
        },
        {
          title: "Dot Product Properties",
          explanation:
            "Commutative, distributive, gives projection of one vector onto another. Zero when vectors are perpendicular.",
        },
        {
          title: "Cross Product Properties",
          explanation:
            "Anti-commutative (A×B = -B×A), perpendicular to plane of inputs, follows right-hand rule. Zero when vectors are parallel.",
        },
        {
          title: "Unit Vector Normalization",
          explanation:
            "Any vector divided by its magnitude gives unit vector in that direction. Preserves direction, standardizes magnitude.",
        },
        {
          title: "Relative Velocity",
          explanation:
            "Velocity of object A relative to B: v_AB = v_A - v_B. Vector subtraction accounts for reference frame motion.",
        },
      ],
      definitions: [
        {
          term: "Vector Quantity",
          meaning:
            "Physical quantity requiring both magnitude and direction for complete specification (displacement, velocity, force)",
        },
        {
          term: "Scalar Quantity",
          meaning:
            "Physical quantity completely specified by magnitude alone, independent of direction (mass, time, temperature)",
        },
        {
          term: "Vector Magnitude",
          meaning: "The length or size of a vector, always non-negative, denoted |A| or A",
        },
        {
          term: "Standard Unit Vectors",
          meaning:
            "Orthonormal basis vectors: î (x-direction), ĵ (y-direction), k̂ (z-direction), each with magnitude 1",
        },
        {
          term: "Vector Components",
          meaning:
            "Projections of vector onto coordinate axes: Ax = A cosθ, Ay = A sinθ where θ is from positive x-axis",
        },
        {
          term: "Resultant Vector",
          meaning: "Single vector having same effect as combination of other vectors, found through vector addition",
        },
        {
          term: "Position Vector (r)",
          meaning: "Vector from coordinate origin to point in space, specifies absolute location",
        },
        {
          term: "Displacement Vector (Δr)",
          meaning: "Net change in position, straight-line vector from initial to final position, path-independent",
        },
        {
          term: "Dot Product (A·B)",
          meaning: "Scalar product yielding |A||B|cosθ, measures parallel component, used in work calculations",
        },
        {
          term: "Cross Product (A×B)",
          meaning: "Vector product perpendicular to both inputs, magnitude |A||B|sinθ, direction by right-hand rule",
        },
      ],
      formulas: [
        { formula: "|A| = √(Ax² + Ay²)", meaning: "2D vector magnitude using Pythagorean theorem" },
        { formula: "|A| = √(Ax² + Ay² + Az²)", meaning: "3D vector magnitude" },
        {
          formula: "Ax = A cosθ, Ay = A sinθ",
          meaning: "Component decomposition, θ measured counterclockwise from +x axis",
          note: "Most common source of sign errors - be careful with angle",
        },
        {
          formula: "θ = tan⁻¹(Ay/Ax)",
          meaning: "Angle from components",
          note: "Use atan2(Ay, Ax) in programming to get correct quadrant automatically",
        },
        { formula: "R = A + B = (Ax+Bx)î + (Ay+By)ĵ", meaning: "Vector addition in component form" },
        { formula: "â = A/|A|", meaning: "Unit vector in direction of A, normalized to magnitude 1" },
        { formula: "A·B = AxBx + AyBy + AzBz", meaning: "Dot product calculation in Cartesian coordinates" },
        { formula: "A·B = |A||B|cosθ", meaning: "Dot product from magnitudes and included angle" },
        { formula: "cosθ = (A·B)/(|A||B|)", meaning: "Find angle between vectors using dot product" },
        {
          formula: "|A×B| = |A||B|sinθ",
          meaning: "Cross product magnitude",
          note: "Direction perpendicular to both A and B, use right-hand rule",
        },
      ],
      steps: [
        "Classify all quantities as vectors (direction matters) or scalars (direction irrelevant)",
        "Sketch coordinate system and draw all vectors with correct orientation and scale",
        "Choose convenient axes (often horizontal/vertical or parallel/perpendicular to surface)",
        "Resolve each vector into components: Ax = Acosθ, Ay = Asinθ relative to chosen axes",
        "Sum all x-components: Rx = Σ Ax_i, sum all y-components: Ry = Σ Ay_i",
        "Calculate resultant magnitude: R = √(Rx² + Ry²)",
        "Determine resultant direction: θ = tan⁻¹(Ry/Rx), verify quadrant from diagram",
        "Check solution: Does magnitude make sense? Are units correct? Does direction match physics?",
      ],
      examples: [
        {
          title: "Example 1: Perpendicular Vector Addition",
          steps: [
            "Given: A = 3.0 m East, B = 4.0 m North. Find resultant R.",
            "Since perpendicular, direct application: R = √(A² + B²)",
            "R = √(3.0² + 4.0²) = √(9.0 + 16.0) = √25.0 = 5.0 m",
            "θ = tan⁻¹(B/A) = tan⁻¹(4.0/3.0) = 53.1° North of East",
          ],
          answer: "R = 5.0 m at 53.1° North of East (classic 3-4-5 triangle)",
        },
        {
          title: "Example 2: Component Resolution",
          steps: [
            "Given: Force F = 50.0 N at θ = 30.0° above horizontal. Find Fx and Fy.",
            "Fx = F cosθ = 50.0 × cos(30.0°) = 50.0 × 0.8660 = 43.3 N",
            "Fy = F sinθ = 50.0 × sin(30.0°) = 50.0 × 0.5000 = 25.0 N",
            "Verification: √(43.3² + 25.0²) = √(1875 + 625) = 50.0 N ✓",
          ],
          answer: "Horizontal component Fx = 43.3 N, Vertical component Fy = 25.0 N",
        },
        {
          title: "Example 3: Vector Subtraction in Component Form",
          steps: [
            "Given: A = 5î + 3ĵ, B = 2î + 7ĵ. Find C = A - B.",
            "Component-wise: C = (5-2)î + (3-7)ĵ = 3î - 4ĵ",
            "|C| = √(3² + 4²) = 5",
            "θ = tan⁻¹(-4/3) = -53.1° (Q4, below +x axis)",
          ],
          answer: "C = 3î - 4ĵ, magnitude 5, direction 53.1° below positive x-axis",
        },
        {
          title: "Example 4: Angle Between Vectors Using Dot Product",
          steps: [
            "Given: A = 6î + 8ĵ, B = 3î + 4ĵ. Find angle θ between them.",
            "A·B = (6)(3) + (8)(4) = 18 + 32 = 50",
            "|A| = √(36+64) = 10, |B| = √(9+16) = 5",
            "cosθ = (A·B)/(|A||B|) = 50/(10×5) = 50/50 = 1.0 → θ = 0°",
          ],
          answer: "θ = 0°, vectors are parallel (B = 0.5A)",
        },
      ],
      mistakes: [
        "Adding magnitudes instead of vectors: |A| + |B| ≠ |A + B| unless vectors are parallel",
        "Confusing speed (scalar) with velocity (vector) in motion problems",
        "Wrong angle reference: θ must be measured from positive x-axis, not from arbitrary direction",
        "Quadrant errors with inverse tangent: tan⁻¹ only returns -90° to +90°, must check signs separately",
        "Treating distance as displacement: distance is path length (scalar), displacement is net change (vector)",
        "Calculator mode errors: degrees vs radians must match your angle units",
        "Negative magnitudes: impossible by definition. Direction carries the sign information.",
        "Skipping component method for non-parallel vectors: graphical addition is imprecise",
        "Dot vs cross product confusion: dot gives scalar, cross gives perpendicular vector",
        "Unit inconsistency: cannot add 5m + 3m/s. All terms must have compatible units.",
        "Forgetting that i·i = j·j = k·k = 1, but i·j = j·k = k·i = 0 (orthogonality)",
      ],
      resources: [
        {
          title: "Khan Academy - Vectors and Spaces",
          url: "https://khanacademy.org/math/linear-algebra/vectors-and-spaces",
          why: "Comprehensive introduction with practice problems. Visual demonstrations of all operations.",
        },
        {
          title: "PhET Interactive Simulations - Vector Addition",
          url: "https://phet.colorado.edu/en/simulation/vector-addition",
          why: "Hands-on exploration tool. Manipulate vectors visually and see mathematical results update in real-time.",
        },
        {
          title: "MIT OpenCourseWare 8.01 - Lecture 2",
          url: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/",
          why: "Professor Lewin's legendary vector lecture. Rigorous treatment with physical intuition.",
        },
        {
          title: "3Blue1Brown - Vector Series",
          url: "https://youtube.com/watch?v=fNk_zzaMoSs",
          why: "Beautiful animated visualizations. Builds geometric intuition for abstract concepts.",
        },
        {
          title: "Paul's Online Math Notes - Calculus II Vectors",
          url: "https://tutorial.math.lamar.edu/Classes/CalcII/Vectors.aspx",
          why: "Clear written explanations with step-by-step examples. Good for exam preparation.",
        },
        {
          title: "HyperPhysics - Vector Concepts",
          url: "http://hyperphysics.phy-astr.gsu.edu/hbase/vect.html",
          why: "Concise reference with concept map navigation. Quick lookup for formulas.",
        },
        {
          title: "Textbook: University Physics Chapter 1.7-1.10",
          url: "library://young-freedman-15e",
          why: "Official course reading. Aligned with lecture topics and homework problems.",
        },
      ],
      bestNotePhotos: [
        { alt: "Annotated board work showing parallelogram and triangle methods side-by-side" },
        { alt: "Color-coded formula sheet with geometric interpretation diagrams" },
        { alt: "Step-by-step solution of river crossing problem with velocity vectors" },
      ],
      quickRevision: [
        "Vector = magnitude + direction. Scalar = magnitude only. Cannot mix in equations.",
        "ALWAYS sketch vector diagram before calculating. Catches 90% of sign errors.",
        "Standard components: Ax = A cosθ, Ay = A sinθ (θ from +x axis, CCW positive)",
        "Pythagorean magnitude: |A| = √(Ax² + Ay²) in 2D, add Az² term for 3D",
        "Angle from components: θ = tan⁻¹(Ay/Ax), but check quadrant manually or use atan2",
        "Vector addition: Add components separately. Rx = ΣAx_i, Ry = ΣAy_i",
        "Unit vectors: î (East/Right), ĵ (North/Up), k̂ (Out of page). Each has |  | = 1",
        "Dot product A·B = scalar = |A||B|cosθ = AxBx + AyBy + AzBz. Zero when perpendicular.",
        "Cross product A×B = vector ⊥ both, |A×B| = |A||B|sinθ. Direction: right-hand rule. Zero when parallel.",
        "Position r from origin. Displacement Δr = r_f - r_i (path-independent).",
        "Opposite vector: -A has same magnitude, reversed direction",
        "Normalize to unit: â = A/|A| preserves direction, sets magnitude to 1",
        "Zero vector 0 has |0| = 0, no defined direction, additive identity",
        "Commutative: A + B = B + A, A·B = B·A. Anti-commutative: A×B = -B×A",
        "Unit check: [Ax] = [Ay] = [A]. Cannot add meters to seconds!",
      ],
    },
  ],
  "ch-math-201-01": [
    {
      id: "notes-v1-ch-math-201-01",
      chapterId: "ch-math-201-01",
      version: 1,
      generatedAt: "1 day ago",
      overview: [
        "Integration techniques extend basic antiderivatives to handle complex functions",
        "u-substitution is the reverse of chain rule - simplifies integrals by changing variables",
        "Integration by parts comes from product rule: ∫u dv = uv - ∫v du",
        "Trigonometric integrals often need identities to simplify before integrating",
        "Partial fractions decompose rational functions into simpler terms",
      ],
      keyConcepts: [
        {
          title: "u-Substitution",
          explanation:
            "Choose u as the inner function, du as its derivative. Converts complex integral to simpler form.",
        },
        {
          title: "Integration by Parts",
          explanation:
            "Used when product of functions appears. Choose u based on LIATE rule (Log, Inverse trig, Algebraic, Trig, Exponential).",
        },
        {
          title: "Trig Identities",
          explanation: "Power reduction and double angle formulas convert high powers to integrable forms.",
        },
      ],
      definitions: [
        { term: "u-Substitution", meaning: "Variable change technique: if F'(g(x))g'(x), let u = g(x)" },
        { term: "Integration by Parts", meaning: "Formula ∫u dv = uv - ∫v du, derived from product rule" },
      ],
      formulas: [
        { formula: "∫f(g(x))g'(x)dx = ∫f(u)du", meaning: "u-substitution formula, u = g(x)" },
        { formula: "∫u dv = uv - ∫v du", meaning: "Integration by parts" },
      ],
      steps: [
        "Identify which technique applies: substitution, by parts, trig identities, or partial fractions",
        "For substitution: choose u as inner function, find du, replace all x terms",
        "For by parts: choose u and dv using LIATE, find du and v, apply formula",
        "Simplify and integrate the resulting expression",
      ],
      examples: [
        {
          title: "u-Substitution Example",
          steps: ["∫2x(x²+1)⁵ dx", "Let u = x²+1, du = 2x dx", "∫u⁵ du = u⁶/6 + C = (x²+1)⁶/6 + C"],
          answer: "(x²+1)⁶/6 + C",
        },
      ],
      mistakes: [
        "Forgetting to substitute back to original variable",
        "Wrong choice of u in substitution",
        "Incorrect LIATE ordering in integration by parts",
      ],
      resources: [
        {
          title: "Paul's Online Notes",
          url: "https://tutorial.math.lamar.edu/",
          why: "Clear examples for all techniques",
        },
      ],
      bestNotePhotos: [{ alt: "Integration techniques flowchart" }],
      quickRevision: ["u-sub: u = inner function", "By parts: ∫u dv = uv - ∫v du", "LIATE for choosing u"],
    },
  ],
  "ch-cse-110-01": [
    {
      id: "notes-v1-ch-cse-110-01",
      chapterId: "ch-cse-110-01",
      version: 1,
      generatedAt: "3 days ago",
      overview: [
        "Python is an interpreted, high-level programming language",
        "Variables store data without explicit type declaration (dynamic typing)",
        "Python uses indentation for code blocks instead of braces",
        "print() function outputs to console, input() reads user input",
      ],
      keyConcepts: [
        { title: "Variables", explanation: "Named storage locations. Assignment with = operator. Can change type." },
        { title: "Data Types", explanation: "int (integers), float (decimals), str (text), bool (True/False)" },
        {
          title: "Indentation",
          explanation: "Spaces or tabs define code blocks. Must be consistent throughout program.",
        },
      ],
      definitions: [
        { term: "Variable", meaning: "Named reference to a value in memory" },
        { term: "Dynamic Typing", meaning: "Variable type determined at runtime, can change" },
      ],
      formulas: [
        { formula: "variable_name = value", meaning: "Assignment statement" },
        { formula: "print(variable)", meaning: "Output to console" },
      ],
      steps: [
        "Decide what data to store",
        "Choose meaningful variable name (lowercase, underscores)",
        "Assign value using = operator",
        "Use variable in expressions or functions",
      ],
      examples: [
        {
          title: "Basic Variable Assignment",
          steps: ['name = "Alice"', "age = 20", 'print(name, "is", age, "years old")'],
          answer: "Output: Alice is 20 years old",
        },
      ],
      mistakes: [
        "Using reserved keywords as variable names",
        "Inconsistent indentation causing IndentationError",
        "Forgetting quotes around strings",
      ],
      resources: [
        {
          title: "Python.org Tutorial",
          url: "https://docs.python.org/3/tutorial/",
          why: "Official documentation with examples",
        },
      ],
      bestNotePhotos: [{ alt: "Python syntax cheat sheet" }],
      quickRevision: ["Variables: name = value", "Types: int, float, str, bool", "Indentation matters!"],
    },
  ],
}

// Helper functions
export function getSubject(subjectId: string): Subject | undefined {
  return subjects.find((s) => s.id === subjectId)
}

export function getCoursesBySubject(subjectId: string): Course[] {
  return courses.filter((c) => c.subjectId === subjectId)
}

export function getCourse(courseId: string): Course | undefined {
  return courses.find((c) => c.id === courseId)
}

export function getChaptersByCourse(courseId: string): Chapter[] {
  return chapters.filter((ch) => ch.courseId === courseId)
}

export function getSubjectByCourse(courseId: string): Subject | undefined {
  const course = getCourse(courseId)
  if (!course) return undefined
  return getSubject(course.subjectId)
}

export function getChapter(chapterId: string): Chapter | undefined {
  return chapters.find((ch) => ch.id === chapterId)
}

export function getContributionsByChapter(chapterId: string): Contribution[] {
  return contributionsByChapter[chapterId] || []
}

export function getNoteStackByChapter(chapterId: string): NoteStackItem[] {
  return noteStackByChapter[chapterId] || []
}

// Get featured chapters (most active/recent compiled chapters)
export function getFeaturedChapters(limit = 3): Chapter[] {
  return chapters
    .filter((ch) => ch.status === "Compiled")
    .sort((a, b) => b.contributions - a.contributions)
    .slice(0, limit)
}

// Helper function to get unified notes for a chapter
export function getUnifiedNotesByChapter(chapterId: string, version?: number): UnifiedNotes | undefined {
  const notes = unifiedNotesByChapter[chapterId]
  if (!notes || notes.length === 0) return undefined

  if (version !== undefined) {
    return notes.find((n) => n.version === version)
  }

  // Return latest version by default
  return notes.reduce((latest, current) => (current.version > latest.version ? current : latest), notes[0])
}
