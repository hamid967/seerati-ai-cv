/**
 * Shared resume fixtures for template QA (plain ESM so Node scripts can use
 * them without a TypeScript build step).
 *
 * Three stress levels per language:
 *   short       — nearly empty resume (fresh graduate, one line each)
 *   normal      — a realistic Gulf resume
 *   long-stress — very long names, many roles, many bullets, many skills and
 *                 mixed RTL/LTR text inside the same line
 */

const item = (id, title, detail = "") => ({ id, title, detail });

export const fixtures = [
  {
    id: "ar-short",
    lang: "ar",
    level: "short",
    data: {
      personal: {
        fullName: "سارة الحربي",
        jobTitle: "محلل بيانات",
        email: "sara@example.com",
        phone: "+966500000000",
        city: "الرياض",
        country: "السعودية",
      },
      summary: "حديثة تخرج في نظم المعلومات.",
      experience: [],
      education: [
        { id: "e1", degree: "بكالوريوس نظم المعلومات", school: "جامعة الملك سعود", start: "2020", end: "2024" },
      ],
      skills: [{ id: "s1", name: "إكسل" }],
      languages: [{ id: "l1", name: "العربية", level: "لغة أم" }],
      certificates: [],
      projects: [],
      achievements: [],
      volunteering: [],
      links: [],
      references: [],
      custom: [],
      sectionOrder: ["summary", "education", "skills", "languages"],
    },
  },
  {
    id: "ar-normal",
    lang: "ar",
    level: "normal",
    data: {
      personal: {
        fullName: "عبدالله بن محمد القحطاني",
        jobTitle: "مدير مشاريع",
        email: "abdullah@example.com",
        phone: "+966555555555",
        city: "الدمام",
        country: "السعودية",
        nationality: "سعودي",
      },
      summary:
        "مدير مشاريع بخبرة تسع سنوات في قطاع الطاقة، أقود فرقاً متعددة التخصصات وأدير محافظ مشاريع بميزانيات تشغيلية وتنفيذية.",
      targetJob: "مدير مشاريع أول",
      experience: [
        {
          id: "x1",
          role: "مدير مشاريع",
          company: "شركة الخليج للمقاولات",
          location: "الدمام",
          start: "2021",
          current: true,
          bullets: [
            "قدت 12 مشروعاً بقيمة إجمالية بلغت 48 مليون ريال مع الالتزام بالجدول الزمني.",
            "خفضت زمن دورة الموافقات من 14 يوماً إلى 6 أيام عبر إعادة تصميم سير العمل.",
          ],
        },
        {
          id: "x2",
          role: "مهندس تخطيط",
          company: "مجموعة الشرق الصناعية",
          location: "الجبيل",
          start: "2016",
          end: "2021",
          bullets: ["أعددت جداول Primavera P6 لأربعة مواقع تشغيلية."],
        },
      ],
      education: [
        { id: "e1", degree: "بكالوريوس هندسة صناعية", school: "جامعة الملك فهد للبترول والمعادن", start: "2012", end: "2016" },
      ],
      skills: [
        { id: "s1", name: "إدارة المشاريع", level: 5 },
        { id: "s2", name: "Primavera P6", level: 4 },
        { id: "s3", name: "تحليل المخاطر", level: 4 },
      ],
      languages: [
        { id: "l1", name: "العربية", level: "لغة أم" },
        { id: "l2", name: "الإنجليزية", level: "متقدم" },
      ],
      certificates: [item("c1", "PMP", "معهد إدارة المشاريع")],
      projects: [item("p1", "برنامج تحول التشغيل", "توحيد إدارة المشاريع في أربع إدارات")],
      achievements: [item("a1", "جائزة التميز التشغيلي 2023")],
      volunteering: [],
      links: [{ id: "k1", label: "LinkedIn", url: "https://linkedin.com/in/example" }],
      references: [],
      custom: [],
      sectionOrder: [
        "summary",
        "experience",
        "education",
        "skills",
        "languages",
        "certificates",
        "projects",
        "achievements",
        "links",
      ],
    },
  },
  {
    id: "ar-long-stress",
    lang: "ar",
    level: "long-stress",
    data: {
      personal: {
        fullName: "عبدالرحمن بن عبدالعزيز بن سليمان الشهراني الغامدي",
        jobTitle: "مدير عام التحول الرقمي وتقنية المعلومات والعمليات المؤسسية",
        email: "abdulrahman.abdulaziz.alshahrani@verylongcompanydomain.example.com",
        phone: "+966 55 555 5555",
        city: "مدينة الملك عبدالله الاقتصادية",
        country: "المملكة العربية السعودية",
        nationality: "سعودي",
      },
      summary:
        "قائد تحول رقمي Digital Transformation بخبرة تتجاوز 18 عاماً في قطاعات الطاقة والبنوك والاتصالات، قدت برامج ERP و SAP S/4HANA و Cloud Migration وأدرت فرقاً تصل إلى 120 موظفاً موزعين بين الرياض وجدة والدمام، مع تركيز على الحوكمة والامتثال وتحسين تجربة العميل.",
      targetJob: "Chief Digital Officer",
      jobDescription:
        "We are looking for a CDO with SAP, Power BI and change-management experience across KSA operations.",
      experience: Array.from({ length: 7 }).map((_, i) => ({
        id: `x${i + 1}`,
        role: `مدير عام التحول الرقمي والعمليات — Division ${i + 1}`,
        company: `شركة المجموعة السعودية القابضة للتقنية والاتصالات ${i + 1} (Saudi Holding Tech ${i + 1})`,
        location: "الرياض / Riyadh",
        start: `${2004 + i * 2}`,
        end: `${2006 + i * 2}`,
        bullets: Array.from({ length: 6 }).map(
          (_, b) =>
            `أنجزت المرحلة ${b + 1} من برنامج SAP S/4HANA وخفّضت زمن الإغلاق المالي بنسبة ${10 + b}% مع فريق مكوّن من ${8 + b} أعضاء موزعين على ثلاث مدن، وتوثيق كامل عبر Power BI dashboards.`,
        ),
      })),
      education: [
        { id: "e1", degree: "ماجستير إدارة الأعمال التنفيذي — Executive MBA", school: "جامعة الملك عبدالله للعلوم والتقنية (KAUST)", start: "2010", end: "2012" },
        { id: "e2", degree: "بكالوريوس هندسة الحاسب الآلي والشبكات", school: "جامعة الملك فهد للبترول والمعادن (KFUPM)", start: "2000", end: "2004", note: "مرتبة الشرف الأولى" },
      ],
      skills: Array.from({ length: 24 }).map((_, i) => ({
        id: `s${i + 1}`,
        name: i % 2 ? `مهارة تشغيلية متقدمة رقم ${i + 1}` : `Advanced Enterprise Skill ${i + 1}`,
        level: (i % 5) + 1,
      })),
      languages: [
        { id: "l1", name: "العربية", level: "لغة أم" },
        { id: "l2", name: "الإنجليزية", level: "متقدم — C1" },
        { id: "l3", name: "الفرنسية", level: "مبتدئ" },
      ],
      certificates: Array.from({ length: 8 }).map((_, i) => item(`c${i + 1}`, `شهادة احترافية معتمدة ${i + 1} — Certified Professional ${i + 1}`, "جهة مانحة دولية")),
      projects: Array.from({ length: 6 }).map((_, i) => item(`p${i + 1}`, `مشروع تحول مؤسسي كبير رقم ${i + 1}`, "وصف تفصيلي طويل يشرح النطاق والأثر والفرق المشاركة والميزانية التقديرية.")),
      achievements: Array.from({ length: 5 }).map((_, i) => item(`a${i + 1}`, `إنجاز موثق رقم ${i + 1} بنسبة تحسين ${5 + i}%`)),
      volunteering: [item("v1", "عضو مجلس إدارة جمعية تقنية غير ربحية")],
      links: [
        { id: "k1", label: "LinkedIn", url: "https://www.linkedin.com/in/a-very-long-profile-handle-example" },
        { id: "k2", label: "الموقع الشخصي", url: "https://portfolio.example.com/abdulrahman" },
      ],
      references: [item("r1", "متاحة عند الطلب")],
      custom: [
        {
          id: "cs1",
          title: "العضويات المهنية",
          items: [item("ci1", "الهيئة السعودية للمهندسين"), item("ci2", "PMI Chapter")],
        },
      ],
      sectionOrder: [
        "summary",
        "experience",
        "education",
        "skills",
        "languages",
        "certificates",
        "projects",
        "achievements",
        "volunteering",
        "links",
        "references",
        "custom",
      ],
    },
  },
  {
    id: "en-short",
    lang: "en",
    level: "short",
    data: {
      personal: {
        fullName: "Lina Al-Otaibi",
        jobTitle: "Marketing Specialist",
        email: "lina@example.com",
        phone: "+966501112233",
        city: "Jeddah",
        country: "Saudi Arabia",
      },
      summary: "Marketing graduate focused on content and analytics.",
      experience: [],
      education: [{ id: "e1", degree: "BA Marketing", school: "King Abdulaziz University", start: "2021", end: "2025" }],
      skills: [{ id: "s1", name: "SEO" }],
      languages: [{ id: "l1", name: "Arabic", level: "Native" }],
      certificates: [],
      projects: [],
      achievements: [],
      volunteering: [],
      links: [],
      references: [],
      custom: [],
      sectionOrder: ["summary", "education", "skills", "languages"],
    },
  },
  {
    id: "en-normal",
    lang: "en",
    level: "normal",
    data: {
      personal: {
        fullName: "Mohammed A. Al-Dossary",
        jobTitle: "Data Analyst",
        email: "m.aldossary@example.com",
        phone: "+966512345678",
        city: "Khobar",
        country: "Saudi Arabia",
      },
      summary:
        "Data analyst with 6 years in banking analytics, building Power BI reporting layers and SQL data models for risk and retail teams.",
      targetJob: "Senior Data Analyst",
      experience: [
        {
          id: "x1",
          role: "Data Analyst",
          company: "Gulf National Bank",
          location: "Khobar",
          start: "2020",
          current: true,
          bullets: [
            "Automated 31 manual reports, saving 40 hours per month across two departments.",
            "Built a churn dashboard adopted by 4 business units.",
          ],
        },
      ],
      education: [{ id: "e1", degree: "BSc Statistics", school: "KFUPM", start: "2014", end: "2018" }],
      skills: [
        { id: "s1", name: "SQL", level: 5 },
        { id: "s2", name: "Power BI", level: 5 },
        { id: "s3", name: "Python", level: 3 },
      ],
      languages: [
        { id: "l1", name: "Arabic", level: "Native" },
        { id: "l2", name: "English", level: "Fluent" },
      ],
      certificates: [item("c1", "Microsoft Certified: Data Analyst Associate")],
      projects: [item("p1", "Retail churn model", "Reduced report turnaround from 5 days to same-day")],
      achievements: [],
      volunteering: [],
      links: [{ id: "k1", label: "GitHub", url: "https://github.com/example" }],
      references: [],
      custom: [],
      sectionOrder: ["summary", "experience", "education", "skills", "languages", "certificates", "projects", "links"],
    },
  },
  {
    id: "en-long-stress",
    lang: "en",
    level: "long-stress",
    data: {
      personal: {
        fullName: "Christopher Alexander Montgomery-Fitzgerald III",
        jobTitle: "Global Head of Enterprise Transformation, Data Platforms and Operational Excellence",
        email: "christopher.montgomery.fitzgerald@extremely-long-corporate-domain.example.com",
        phone: "+966 (55) 555-5555",
        city: "King Abdullah Economic City",
        country: "Kingdom of Saudi Arabia",
      },
      summary:
        "Transformation executive with 20+ years across energy, telecom and banking. Delivered SAP S/4HANA, أرامكو digital programmes, and cloud migrations spanning الرياض, Jeddah and Dubai with teams of 150+.",
      targetJob: "Chief Operating Officer",
      experience: Array.from({ length: 8 }).map((_, i) => ({
        id: `x${i + 1}`,
        role: `Global Director of Enterprise Transformation and Data Platforms — Region ${i + 1}`,
        company: `International Industrial and Petrochemical Holdings Group ${i + 1} (شركة ${i + 1})`,
        location: "Riyadh / الرياض",
        start: `${2003 + i * 2}`,
        end: `${2005 + i * 2}`,
        bullets: Array.from({ length: 6 }).map(
          (_, b) =>
            `Delivered wave ${b + 1} of the enterprise programme, improving throughput by ${12 + b}% while coordinating ${9 + b} workstreams across three countries and reporting to the board quarterly.`,
        ),
      })),
      education: [
        { id: "e1", degree: "MBA, Strategy and Operations", school: "London Business School", start: "2008", end: "2010" },
        { id: "e2", degree: "BEng Computer Engineering", school: "KFUPM", start: "1999", end: "2003", note: "First class honours" },
      ],
      skills: Array.from({ length: 26 }).map((_, i) => ({
        id: `s${i + 1}`,
        name: i % 3 === 0 ? `Enterprise Capability Number ${i + 1}` : `مهارة ${i + 1}`,
        level: (i % 5) + 1,
      })),
      languages: [
        { id: "l1", name: "English", level: "Native" },
        { id: "l2", name: "Arabic", level: "Professional" },
      ],
      certificates: Array.from({ length: 9 }).map((_, i) => item(`c${i + 1}`, `Certified Enterprise Practitioner Level ${i + 1}`, "Global institute")),
      projects: Array.from({ length: 7 }).map((_, i) => item(`p${i + 1}`, `Enterprise Programme ${i + 1}`, "Long descriptive text covering scope, impact, teams and governance model.")),
      achievements: Array.from({ length: 6 }).map((_, i) => item(`a${i + 1}`, `Recognised achievement ${i + 1}`)),
      volunteering: [item("v1", "Mentor, non-profit technology council")],
      links: [
        { id: "k1", label: "LinkedIn", url: "https://www.linkedin.com/in/christopher-montgomery-fitzgerald-example" },
        { id: "k2", label: "Portfolio", url: "https://portfolio.example.com/christopher" },
      ],
      references: [item("r1", "Available on request")],
      custom: [
        { id: "cs1", title: "Board memberships", items: [item("ci1", "Industry Data Council"), item("ci2", "PMI Chapter")] },
      ],
      sectionOrder: [
        "summary",
        "experience",
        "education",
        "skills",
        "languages",
        "certificates",
        "projects",
        "achievements",
        "volunteering",
        "links",
        "references",
        "custom",
      ],
    },
  },
];

export const fixtureById = (id) => fixtures.find((f) => f.id === id) ?? null;
