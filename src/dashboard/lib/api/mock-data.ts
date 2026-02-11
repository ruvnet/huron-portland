import type { Proposal } from "../types";

export const MOCK_PROPOSALS: Proposal[] = [
  {
    id: "prop-001",
    title: "AI-Driven Drug Discovery for Rare Diseases",
    status: "active",
    principalInvestigator: "Dr. Sarah Chen",
    department: "Biomedical Engineering",
    sponsor: "NIH",
    requestedAmount: 2500000,
    approvedAmount: 2350000,
    submittedDate: "2024-01-15",
    startDate: "2024-04-01",
    endDate: "2027-03-31",
    description:
      "Leveraging machine learning models to identify novel drug candidates for orphan diseases with limited treatment options.",
    tags: ["AI/ML", "drug-discovery", "rare-diseases"],
    tenantId: "tenant-001",
  },
  {
    id: "prop-002",
    title: "Quantum Computing for Climate Modeling",
    status: "under_review",
    principalInvestigator: "Dr. James Park",
    department: "Computer Science",
    sponsor: "NSF",
    requestedAmount: 1800000,
    approvedAmount: null,
    submittedDate: "2024-06-01",
    startDate: null,
    endDate: null,
    description:
      "Developing quantum algorithms to improve the resolution and accuracy of global climate models.",
    tags: ["quantum", "climate", "modeling"],
    tenantId: "tenant-001",
  },
  {
    id: "prop-003",
    title: "Urban Resilience through Smart Infrastructure",
    status: "approved",
    principalInvestigator: "Dr. Maria Rodriguez",
    department: "Civil Engineering",
    sponsor: "DOE",
    requestedAmount: 3200000,
    approvedAmount: 3000000,
    submittedDate: "2024-03-10",
    startDate: "2024-09-01",
    endDate: "2027-08-31",
    description:
      "Integrating IoT sensors and AI analytics to build adaptive urban infrastructure systems.",
    tags: ["smart-city", "IoT", "infrastructure"],
    tenantId: "tenant-001",
  },
  {
    id: "prop-004",
    title: "Genomic Biomarkers for Early Cancer Detection",
    status: "draft",
    principalInvestigator: "Dr. Emily Watson",
    department: "Molecular Biology",
    sponsor: "NCI",
    requestedAmount: 1500000,
    approvedAmount: null,
    submittedDate: null,
    startDate: null,
    endDate: null,
    description:
      "Identifying circulating tumor DNA biomarkers for non-invasive early-stage cancer screening.",
    tags: ["genomics", "cancer", "biomarkers"],
    tenantId: "tenant-001",
  },
  {
    id: "prop-005",
    title: "Autonomous Drone Swarms for Environmental Monitoring",
    status: "submitted",
    principalInvestigator: "Dr. Alex Nguyen",
    department: "Aerospace Engineering",
    sponsor: "DARPA",
    requestedAmount: 4100000,
    approvedAmount: null,
    submittedDate: "2024-07-20",
    startDate: null,
    endDate: null,
    description:
      "Designing cooperative drone swarm systems for real-time environmental data collection over large areas.",
    tags: ["drones", "swarm", "environment"],
    tenantId: "tenant-001",
  },
  {
    id: "prop-006",
    title: "Neuromorphic Computing for Edge AI",
    status: "rejected",
    principalInvestigator: "Dr. Robert Kim",
    department: "Electrical Engineering",
    sponsor: "IARPA",
    requestedAmount: 2200000,
    approvedAmount: null,
    submittedDate: "2024-02-28",
    startDate: null,
    endDate: null,
    description:
      "Building brain-inspired computing architectures for ultra-low-power edge inference.",
    tags: ["neuromorphic", "edge-AI", "hardware"],
    tenantId: "tenant-002",
  },
  {
    id: "prop-007",
    title: "Sustainable Materials for Next-Gen Batteries",
    status: "amendments_requested",
    principalInvestigator: "Dr. Lisa Thompson",
    department: "Materials Science",
    sponsor: "DOE",
    requestedAmount: 2800000,
    approvedAmount: null,
    submittedDate: "2024-04-15",
    startDate: null,
    endDate: null,
    description:
      "Researching earth-abundant materials to replace cobalt and lithium in energy storage systems.",
    tags: ["batteries", "sustainability", "materials"],
    tenantId: "tenant-001",
  },
  {
    id: "prop-008",
    title: "Federated Learning for Healthcare Privacy",
    status: "reporting",
    principalInvestigator: "Dr. David Patel",
    department: "Health Informatics",
    sponsor: "NIH",
    requestedAmount: 1900000,
    approvedAmount: 1850000,
    submittedDate: "2023-09-01",
    startDate: "2024-01-01",
    endDate: "2026-12-31",
    description:
      "Implementing privacy-preserving distributed machine learning across hospital networks.",
    tags: ["federated-learning", "privacy", "healthcare"],
    tenantId: "tenant-001",
  },
  {
    id: "prop-009",
    title: "CRISPR Gene Therapy for Sickle Cell Disease",
    status: "compliance_review",
    principalInvestigator: "Dr. Aisha Johnson",
    department: "Genetics",
    sponsor: "NIH",
    requestedAmount: 5500000,
    approvedAmount: null,
    submittedDate: "2024-05-10",
    startDate: null,
    endDate: null,
    description:
      "Developing targeted CRISPR-Cas9 therapies for hemoglobin gene correction in sickle cell patients.",
    tags: ["CRISPR", "gene-therapy", "sickle-cell"],
    tenantId: "tenant-002",
  },
  {
    id: "prop-010",
    title: "Robotic Exoskeletons for Rehabilitation",
    status: "budget_review",
    principalInvestigator: "Dr. Michael Torres",
    department: "Mechanical Engineering",
    sponsor: "VA",
    requestedAmount: 3400000,
    approvedAmount: null,
    submittedDate: "2024-06-25",
    startDate: null,
    endDate: null,
    description:
      "Designing adaptive robotic exoskeletons for personalized physical rehabilitation programs.",
    tags: ["robotics", "exoskeleton", "rehabilitation"],
    tenantId: "tenant-001",
  },
  {
    id: "prop-011",
    title: "Deep Sea Carbon Sequestration Study",
    status: "closeout",
    principalInvestigator: "Dr. Helen Brooks",
    department: "Marine Science",
    sponsor: "NOAA",
    requestedAmount: 1200000,
    approvedAmount: 1200000,
    submittedDate: "2022-03-01",
    startDate: "2022-07-01",
    endDate: "2024-06-30",
    description:
      "Evaluating deep ocean geological formations for long-term carbon dioxide storage viability.",
    tags: ["carbon", "ocean", "sequestration"],
    tenantId: "tenant-001",
  },
  {
    id: "prop-012",
    title: "Photonic Chips for Secure Communications",
    status: "awaiting_signature",
    principalInvestigator: "Dr. Yuki Tanaka",
    department: "Physics",
    sponsor: "NIST",
    requestedAmount: 2700000,
    approvedAmount: 2700000,
    submittedDate: "2024-04-01",
    startDate: "2024-10-01",
    endDate: "2027-09-30",
    description:
      "Fabricating integrated photonic circuits for quantum key distribution networks.",
    tags: ["photonics", "quantum", "security"],
    tenantId: "tenant-002",
  },
];

export function getMockProposals(): Proposal[] {
  return MOCK_PROPOSALS;
}

export function getMockProposalById(id: string): Proposal | undefined {
  return MOCK_PROPOSALS.find((p) => p.id === id);
}

export function getMockStatusCounts() {
  const counts: Record<string, number> = {};
  for (const p of MOCK_PROPOSALS) {
    counts[p.status] = (counts[p.status] || 0) + 1;
  }
  return Object.entries(counts).map(([status, count]) => ({ status, count }));
}

export function getMockDepartmentBudgets() {
  const depts: Record<string, { requested: number; approved: number }> = {};
  for (const p of MOCK_PROPOSALS) {
    if (!depts[p.department]) {
      depts[p.department] = { requested: 0, approved: 0 };
    }
    depts[p.department].requested += p.requestedAmount;
    depts[p.department].approved += p.approvedAmount || 0;
  }
  return Object.entries(depts).map(([department, data]) => ({
    department,
    ...data,
  }));
}
