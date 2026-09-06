/* ==========================================================================
   VIBENCODE / SHARED DATA
   The six services, in one place. The home page cycles them, the services
   pages render them, and the cursor stream is built from their words - so a
   copy change lands everywhere at once and nothing can drift out of step.
   ========================================================================== */

const services = {
  genai: {
    code: "01 / GenAI implementation",
    title: ["Beyond the demo.", "Into your business."],
    description:
      "We build GenAI applications and workflows connected to your data, tools, and users—from retrieval-based assistants to integrated business capabilities.",
    outputs: ["Solution architecture", "Working implementation", "Evaluation & deployment plan"],
    cta: "Discuss an implementation",
    interest: "GenAI implementation",
    said: "Make support smarter.",
    became: "A retrieval assistant over your ticket history and product docs, answering with citations, measured on a set of real tickets, and handing to a person the moment it is not sure."
  },
  agents: {
    code: "02 / Agents & orchestration",
    title: ["Autonomy needs", "engineering."],
    description:
      "We design agent roles, tool access, handoffs, state, and recovery paths. Human approvals and evaluation are part of the workflow—not additions after the demo.",
    outputs: ["Agent architecture", "Tool integrations", "Approval & recovery paths"],
    cta: "Discuss an agentic workflow",
    interest: "Agents and orchestration",
    said: "Let’s get agents doing this end to end.",
    became: "Agents with named roles and scoped tool access, state that survives a crash, a retry path that does not loop forever, and a human approval before anything writes."
  },
  development: {
    code: "03 / AI-powered development",
    title: ["More than", "generating code."],
    description:
      "We integrate AI into planning, implementation, testing, and review. Repository context, developer control, and quality gates stay central to the engineering workflow.",
    outputs: ["Development workflow", "Agent & toolchain integration", "Team enablement"],
    cta: "Discuss your engineering workflow",
    interest: "AI-powered development",
    said: "We should be using AI in engineering.",
    became: "AI in planning, review and test generation, with repository context, an audit trail on every suggestion, and the merge gate exactly where it was."
  },
  sovereign: {
    code: "04 / Sovereign AI",
    title: ["Your requirements.", "Your architecture."],
    description:
      "We clarify requirements for data location, model hosting, access, and operational ownership, then design an appropriate on-premises, private-cloud, or hybrid deployment.",
    outputs: ["Sovereignty assessment", "Deployment architecture", "Operational handover"],
    cta: "Discuss a sovereign deployment",
    interest: "Sovereign AI",
    said: "None of our data can leave the country.",
    became: "Model weights on your hardware in your region, under your keys, with retention you set and an audit trail on every call."
  },
  strategy: {
    code: "05 / Use-case strategy",
    title: ["Choose the work", "worth changing."],
    description:
      "We work with business and technical stakeholders to identify opportunities, examine feasibility, and prioritize what to test or build. A useful next step beats an inflated roadmap.",
    outputs: ["Opportunity assessment", "Feasibility review", "Prioritized pilot brief"],
    cta: "Explore your AI opportunities",
    interest: "Use-case strategy",
    said: "The board wants an AI roadmap.",
    became: "Every candidate use case assessed for value, feasibility and risk, ranked against each other, with one pilot brief specific enough to start on Monday."
  },
  research: {
    code: "06 / Applied research",
    title: ["Turn uncertainty", "into evidence."],
    description:
      "We investigate technical questions through prototypes, comparisons, and task-specific evaluations. Findings explain tradeoffs, limitations, and what they mean for implementation.",
    outputs: ["Technical investigation", "Comparative evaluation", "Implementation recommendation"],
    cta: "Bring us a research question",
    interest: "Applied research",
    said: "Which model should we be using?",
    became: "A comparison run on your task and your data, with the limits stated, the failure modes named, and a recommendation that says when it stops being true."
  }
};
