# Intent Taxonomy

The Phase 19 Intent Router recognizes user goals locally in Arabic, English, and mixed-language commands. Matching is phrase-based and normalized for common Arabic orthographic variation, punctuation, casing, and short natural commands.

| Intent             | Example                                  | Required context           | Safe fallback                  |
| ------------------ | ---------------------------------------- | -------------------------- | ------------------------------ |
| `create_resume`    | «أنشئ سيرتي» / “build my CV”             | resume                     | open Smart Start               |
| `import_resume`    | «استورد سيرتي» / “upload resume”         | file or text               | ask for a file or paste        |
| `improve_resume`   | «حسن سيرتي» / “fix my CV”                | resume                     | local Resume Health            |
| `target_job`       | «جهزني لوظيفة» / “match this job”        | job description            | ask for pasted description     |
| `check_ats`        | «فحص ATS» / “check ATS”                  | resume                     | local ATS rules                |
| `translate_resume` | «ترجم السيرة» / “translate CV”           | resume and target language | ask target language            |
| `cover_letter`     | «اكتب خطاب تقديم» / “cover letter”       | resume and job target      | ask for role/company           |
| `interview_prep`   | «استعد للمقابلة» / “interview prep”      | job target                 | evidence-based local questions |
| `change_template`  | «غير القالب» / “choose a template”       | resume                     | local template recommendation  |
| `shorten_resume`   | «قصر السيرة» / “make it shorter”         | resume                     | local layout review            |
| `create_profile`   | «أنشئ ملفاً مهنياً» / “build my profile” | identity                   | ask professional goal          |

Confidence below the routing threshold returns `clarify`; the router never selects an intent merely because it is convenient. The result includes required and missing context, a recommended next action, and a safe fallback. The router performs no network call and stores no text.
