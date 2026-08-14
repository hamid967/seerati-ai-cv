# Specialty Template Matrix

## Common model

Every initial specialty uses one deterministic `ResumeData` source and four existing platform templates. The presentation differs by template, but content is never regenerated or altered merely because the visitor opens a preview, compares two cards, or chooses a different layout.

| Template ID             | Arabic name     | English name        | Intended guidance                                                    | ATS statement                                                                       |
| ----------------------- | --------------- | ------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `classic-ats`           | كلاسيكي ATS     | Classic ATS         | Conservative, clear starting structure                               | High structural guidance; no hiring guarantee                                       |
| `modern` or `executive` | عصري أو تنفيذي  | Modern or Executive | Contemporary presentation; executive is selected for advanced levels | Review preview and PDF before use                                                   |
| `saudi-professional`    | سعودي مهني      | Saudi Professional  | Bilingual-market presentation option                                 | Supports RTL where the platform template supports it; no regional affiliation claim |
| `minimal` or `creative` | مبسّط أو إبداعي | Minimal or Creative | Minimal default; Creative appears for software development and sales | Requires review of structure and PDF before use                                     |

## Experience-level adjustment

Student samples place education and projects before experience. Graduate, junior, and career-change samples contain one fictional experience entry. Mid-level, advanced, manager, and executive samples contain two fictional entries and may surface the Executive template. All entries still require explicit replacement and confirmation.

| Specialty            | Primary professional template | Optional visual template | Initial content focus                                               |
| -------------------- | ----------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Software development | Classic ATS                   | Creative                 | Components, testing, API design, fictional internal project         |
| Accounting           | Classic ATS                   | Minimal                  | Records, reporting, reconciliations, sample workbook                |
| Civil engineering    | Saudi Professional            | Minimal                  | Drawings, site coordination, quality and safety                     |
| Human resources      | Modern                        | Minimal                  | Recruitment, employee processes, onboarding materials               |
| Nursing              | Classic ATS                   | Minimal                  | Safe care, documentation, clinical communication                    |
| Sales                | Modern                        | Creative                 | Opportunity organisation, commercial communication, sample pipeline |

## User control

Noura never selects a template automatically. The visitor can view the reason, strengths, limitations, expected page count, and ATS guidance for each option. They can add two cards to a local comparison and choose the final layout themselves. The comparison is component memory only and is not persisted.

## Visual constraints

Cards use lightweight CSS thumbnails. The application does not render all full resumes at initial flow load. The existing full editor/preview becomes available only after the visitor chooses a template. The initial slice does not claim an exact final page count because page count depends on later verified content and the existing renderer.
