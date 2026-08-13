# Seerati Supreme Program — Team Responsibility Matrix

**Program Director:** Seerati Supreme Program Director  
**Operating model:** Virtual delivery roles for planning, review, and evidence ownership. These titles do not represent employment, paid procurement, or external authority.

| Team                     | Accountable director               | Wave 1 responsibility                                                      | File / evidence ownership                             | Required signoff            |
| ------------------------ | ---------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------- |
| Program Management       | Director of Program Management     | Change control, critical path, PR manifest                                 | `MASTER_EXECUTION_PLAN.md`, Change Manifest           | Program Director            |
| Saudi Product            | Saudi Product Director             | Saudi-context requirements; no unsupported market claims                   | Product wording and acceptance criteria               | Product Director            |
| User Experience          | Director of User Experience        | Goal-first, one-question flow, contextual tools                            | Noura verification evidence                           | Noura Intelligence Director |
| Brand and Visual Design  | Global Saudi Creative Director     | Saudi Intelligent Workspace guidance; no heavy visual regression in Wave 1 | Future design brief only                              | Design Director             |
| Noura Experience         | Noura Intelligence Director        | State-machine and journey evidence                                         | `NOURA_STATE_MACHINE.md`, `NOURA_ADAPTIVE_JOURNEY.md` | CTO + Privacy Director      |
| Frontend Engineering     | Principal Frontend Manager         | Route integration and local interaction safety                             | `/assistant`, UI tests                                | QA Director                 |
| Backend and Platform     | Backend Platform Director          | Separate guest and authenticated boundaries                                | Runtime and platform constraints                      | Privacy Director            |
| Career Data Architecture | Career Data Architecture Director  | Plan facts/provenance architecture; do not persist guests                  | Future Wave 2 contract                                | Product Director            |
| AI Engineering           | Director of AI Engineering         | Keep remote AI deferred and consent-gated                                  | Evidence-AI scope exclusion                           | Privacy Director            |
| ATS Science              | Director of ATS Science            | Preserve explainable/disclaimer-first ATS posture                          | ATS acceptance criteria                               | Saudi Product Director      |
| Templates                | Resume Template Platform Director  | Preserve existing templates and preview contracts                          | PDF/print evidence                                    | Document Export Director    |
| PDF and Print            | Document Export Director           | Arabic/English A4 regression proof                                         | Print/PDF artifacts                                   | QA Director                 |
| Secure Import            | Secure Import Director             | Keep import hardening as later dedicated scope                             | Import threat-model backlog                           | Security Director           |
| Security                 | Application Security Director      | No secrets, no injection/egress regressions                                | Security impact review                                | Release Director            |
| Privacy and PDPL         | Saudi Privacy Director             | Memory-only guest, deletion, no prompt/CV telemetry                        | Network and deletion evidence                         | Release Director            |
| Accessibility            | Accessibility Engineering Director | Keyboard, RTL/LTR, reduced motion and semantic evidence                    | Browser hardening artifacts                           | QA Director                 |
| Performance              | Web Performance Director           | Runtime variance and Lighthouse baseline; no budget weakening              | Runtime matrix and performance notes                  | Release Director            |
| QA                       | Quality Engineering Director       | Synthetic fixtures, browser matrix, CI/release evidence                    | Test result ledger                                    | Release Director            |
| Saudi Career Content     | Saudi Career Content Director      | Professional bilingual terminology and no outcome promises                 | Copy review                                           | Product Director            |
| DevOps and SRE           | Platform Reliability Director      | Node/Bun lockstep and CI workflow                                          | Runtime files, CI run URLs                            | CTO                         |
| SEO and Growth           | Saudi Organic Growth Director      | Measure SEO without weakening content/privacy rules                        | Lighthouse SEO observations                           | Product Director            |
| Support and Operations   | Customer Operations Director       | User-facing limitation and deletion language                               | Release notes / rollback                              | Program Director            |

## Decision rights

A P0 privacy, data-loss, free-path, PDF validity, or build failure blocks the PR. A director may request changes within their owned domain but cannot authorize a merge. The Program Director coordinates evidence; the owner authorizes the merge only after the Release Director confirms all required gates.
