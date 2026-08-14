# Sample Content Policy

## Policy statement

Every record created by the Synthetic Specialty Resume Generator is fictional. The generator exists to demonstrate structure, wording, and layout. It does not assert that a visitor, employee, employer, university, client, licence issuer, or third party has performed any activity, held any role, earned any credential, or achieved any result.

## Allowed content

The reviewed local library may include a generic role title, neutral professional summary, example responsibilities, high-level skill categories, project structures, education placeholders, certification placeholders, and non-functional contact/link placeholders. The copy must remain understandable in Arabic and English without inventing numerical performance claims.

| Safe category  | Example pattern                                                |
| -------------- | -------------------------------------------------------------- |
| Identity       | `اسمك الكامل` / `Your Full Name`                               |
| Contact        | `example@email.com`, `05XXXXXXXX`, `linkedin.com/in/your-name` |
| Employer       | `اسم الشركة السابقة` / `Previous Company Name`                 |
| Education      | `اسم الجامعة` / `University Name`                              |
| Responsibility | “Reviewed sample entries and organised supporting documents.”  |
| Project        | “Sample project: internal request-tracking dashboard.”         |
| Training       | “Sample software-development training certificate.”            |

## Prohibited content

The library and tests must not contain a real applicant's information, identity number, actual personal email or phone number, full home address, named customer, real employer claimed as a workplace, real university claimed as an education provider, awarded credential, licence number, confidential work output, or metric that presents a fictional achievement as a fact.

The generator must not use an external language model by default. Optional future AI adaptation must treat all output as sample material, preserve the same metadata boundary, require separate consent, and never classify output as verified.

## Language quality

Arabic and English copy are authored as separate professional phrasing. The English text is not a literal sentence-by-sentence translation of Arabic. Each role contains a neutral description suitable for a sample while avoiding a hiring, ATS, or outcome guarantee.

## Review process

Content changes require a versioned code review, bilingual content review, synthetic-data safety check, generator smoke coverage, and visual preview review. The initial implementation stores the content library in source because the feature has no administrative backend or database dependency. A future admin workflow must not display or collect visitor resume data.

## Incident response

If real or sensitive information enters the library, test fixtures, browser artifacts, logs, or pull-request description, remove it immediately, rotate any affected exposed credential if applicable, invalidate generated artifacts, add a regression assertion, and document the remediation in the PR.
