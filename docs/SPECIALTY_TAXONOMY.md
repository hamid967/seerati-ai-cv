# Specialty Taxonomy

## Reviewed local catalog

The Noura sample flow contains a reviewed bilingual catalog of **thirty-six specialties**. The taxonomy is imported only after a visitor chooses **Create a sample CV for my profession**, which keeps specialty content outside the normal assistant landing bundle. Search matches Arabic and English display names, category names, and bounded local search terms.

| ID | المجموعة العربية | English group | التخصص العربي | English specialty |
| --- | --- | --- | --- | --- |
| `software-development` | التقنية | Technology | تطوير البرمجيات | Software development |
| `software-engineering` | التقنية | Technology | هندسة البرمجيات | Software engineering |
| `data-analysis` | التقنية | Technology | تحليل البيانات | Data analysis |
| `cybersecurity` | التقنية | Technology | الأمن السيبراني | Cybersecurity |
| `it-support` | التقنية | Technology | دعم تقنية المعلومات | IT support |
| `network-engineering` | التقنية | Technology | هندسة الشبكات | Network engineering |
| `cloud-devops` | التقنية | Technology | السحابة وDevOps | Cloud and DevOps |
| `mobile-development` | التقنية | Technology | تطوير تطبيقات الجوال | Mobile development |
| `ui-ux-design` | التقنية | Technology | تصميم تجربة وواجهة المستخدم | UI/UX design |
| `quality-assurance` | التقنية | Technology | ضمان الجودة | Quality assurance |
| `civil-engineering` | الهندسة | Engineering | الهندسة المدنية | Civil engineering |
| `mechanical-engineering` | الهندسة | Engineering | الهندسة الميكانيكية | Mechanical engineering |
| `electrical-engineering` | الهندسة | Engineering | الهندسة الكهربائية | Electrical engineering |
| `architecture` | الهندسة | Engineering | العمارة والتصميم المعماري | Architecture |
| `project-management` | الإدارة والعمليات | Management & operations | إدارة المشاريع | Project management |
| `supply-chain` | الإدارة والعمليات | Management & operations | سلاسل الإمداد | Supply chain |
| `operations-management` | الإدارة والعمليات | Management & operations | إدارة العمليات | Operations management |
| `procurement` | الإدارة والعمليات | Management & operations | المشتريات | Procurement |
| `accounting` | المالية | Finance | المحاسبة | Accounting |
| `financial-analysis` | المالية | Finance | التحليل المالي | Financial analysis |
| `banking` | المالية | Finance | الخدمات المصرفية | Banking |
| `internal-audit` | المالية | Finance | المراجعة الداخلية | Internal audit |
| `investment-analysis` | المالية | Finance | تحليل الاستثمار | Investment analysis |
| `human-resources` | الموارد البشرية | Human resources | الموارد البشرية | Human resources |
| `recruitment` | الموارد البشرية | Human resources | التوظيف | Recruitment |
| `payroll` | الموارد البشرية | Human resources | الرواتب | Payroll |
| `organizational-development` | الموارد البشرية | Human resources | التطوير التنظيمي | Organisational development |
| `sales` | المبيعات والتسويق | Sales & marketing | المبيعات | Sales |
| `digital-marketing` | المبيعات والتسويق | Sales & marketing | التسويق الرقمي | Digital marketing |
| `account-management` | المبيعات والتسويق | Sales & marketing | إدارة الحسابات | Account management |
| `business-development` | المبيعات والتسويق | Sales & marketing | تطوير الأعمال | Business development |
| `customer-service` | المبيعات والتسويق | Sales & marketing | خدمة العملاء | Customer service |
| `ecommerce` | المبيعات والتسويق | Sales & marketing | التجارة الإلكترونية | E-commerce |
| `nursing` | الصحة | Health | التمريض | Nursing |
| `pharmacy` | الصحة | Health | الصيدلة | Pharmacy |
| `laboratory-science` | الصحة | Health | علوم المختبرات | Laboratory science |

## Search and bundle behavior

Search is local, deterministic, case-insensitive, and does not write its query to a URL, database, telemetry payload, or browser storage. The custom-specialty input is a component-memory convenience field only. It is not used by the deterministic generator, does not form part of the optional AI payload, and is cleared when the mounted flow ends.

The catalog and generator are in the lazily loaded sample-flow boundary rather than the standard Noura landing bundle. The optional AI client is also confined to this boundary. The authenticated server function is dynamically imported only after explicit consent and a button press; an unauthenticated visitor receives the local deterministic result without an adaptation request.

> The catalog demonstrates a bounded set of sample structures. It does not represent a verified qualification framework, a claim of professional coverage, or a recommendation to use fictional wording in an employment application.

## Deterministic content model

The six original specialties have specific reviewed role definitions. The thirty expansion specialties use a reviewed group-based fallback that produces bilingual title, education placeholder, summary, three responsibilities, four skills, project, and certificate. Every output is fictional, contains no employer, university, client, person, credential, date, or performance figure, and is marked for user review.

| Group | Fallback skills theme | Intentional content boundary |
| --- | --- | --- |
| Technology | Problem solving, documentation, technical collaboration, prioritisation | Does not claim shipped products, systems access, or metrics. |
| Engineering | Requirements review, technical coordination, quality, safety awareness | Does not claim site, project, licence, or design approval. |
| Finance | Reporting, information analysis, attention to detail, spreadsheets | Does not claim financial outcomes, regulated authority, or employer data. |
| Human resources | Communication, process coordination, record organisation, prioritisation | Does not claim employee records, hiring outcomes, or policy authority. |
| Sales & marketing | Client communication, opportunity organisation, presentations, collaboration | Does not claim revenue, accounts, clients, campaigns, or conversion data. |
| Health | Documentation, procedure adherence, communication, teamwork | Does not claim clinical status, patient activity, licence, or institution. |
| Management & operations | Operations coordination, process improvement, reporting, stakeholder coordination | Does not claim budgets, programmes, vendors, or organisational authority. |

## Expansion governance

A new specialty must have a reviewed bilingual taxonomy entry, bounded search terms, a deterministic role path, safe template suitability, and regression coverage. Optional AI adaptation does not replace this review: it can vary wording only after consent, and its output must pass the server-side schema and anti-fabrication gate before it can be applied to a sample.

| Required review | Decision gate |
| --- | --- |
| Arabic and English terminology | Natural professional wording, not literal translation. |
| Fictional-content safety | No real people, employers, universities, clients, credentials, or numerical achievements. |
| Experience-level fit | Student, graduate, and advanced variants do not imply unearned experience. |
| Template behavior | Four real platform template IDs are selected without promises about ATS or hiring outcomes. |
| Privacy | No specialty text leaves a browser in the anonymous deterministic path. |
| Optional AI | Consent is explicit; input is limited to specialty ID, level, and language; output remains a blocked sample. |
| Test coverage | The all-specialty deterministic smoke and synthetic adaptation contract smoke pass before delivery. |
