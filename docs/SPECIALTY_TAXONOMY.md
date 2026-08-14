# Specialty Taxonomy

## Initial catalog

The first release uses a deliberately small, reviewed taxonomy. The catalog is imported only after the visitor chooses **Create a sample CV for my profession** in Noura. Search matches the Arabic and English display names, category names, and bounded search terms.

| ID                     | المجموعة العربية  | English group     | التخصص العربي   | English specialty    |
| ---------------------- | ----------------- | ----------------- | --------------- | -------------------- |
| `software-development` | التقنية           | Technology        | تطوير البرمجيات | Software development |
| `accounting`           | المالية           | Finance           | المحاسبة        | Accounting           |
| `civil-engineering`    | الهندسة           | Engineering       | الهندسة المدنية | Civil engineering    |
| `human-resources`      | الموارد البشرية   | Human resources   | الموارد البشرية | Human resources      |
| `nursing`              | الصحة             | Health            | التمريض         | Nursing              |
| `sales`                | المبيعات والتسويق | Sales & marketing | المبيعات        | Sales                |

## Search behavior

Search is local, deterministic, case-insensitive, and does not write the query to a URL, database, telemetry payload, or browser storage. The custom-specialty input is a local convenience field only. It is intentionally not used to generate an unsupported profession and is cleared when the mounted flow ends.

> The platform does not claim that the initial catalog covers all professions. When a visitor does not find a specialty, the flow asks them to choose the closest supported example rather than inventing profession-specific facts.

## Expansion governance

A new specialty should be added only with a reviewed bilingual entry, a deterministic role definition, sample responsibilities that do not claim outcomes, a suitable skills set, safe education/certification placeholders, and a template suitability review. The expansion must include generator coverage in `scripts/synthetic-resume-smoke.ts` and a documented update to this file.

| Required review                | Decision gate                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| Arabic and English terminology | Natural professional wording, not literal translation                                    |
| Fictional-content safety       | No real people, employers, universities, clients, credentials, or numerical achievements |
| Experience-level fit           | Student, graduate, and advanced variants do not imply unearned experience                |
| Template behavior              | Four real platform template IDs are selected without promising ATS or hiring outcomes    |
| Privacy                        | No specialty text leaves the browser in the anonymous path                               |

## Deferred catalog

The supplied product brief identifies many additional technology, engineering, business, finance, health, education, legal, hospitality, and creative specialties. They are intentionally deferred pending a content-review process. The first six specialties demonstrate the generator and safety model before expansion.
