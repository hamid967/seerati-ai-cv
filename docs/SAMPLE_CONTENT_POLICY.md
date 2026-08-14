# Sample Content Policy

## Policy statement

Every record created by the Synthetic Specialty Resume Generator is fictional. The generator demonstrates structure, wording, and layout; it does not assert that a visitor, employee, employer, university, client, licence issuer, or third party has performed any activity, held any role, earned any credential, or achieved any result.

This policy applies equally to the reviewed deterministic library and to the optional AI-adapted wording path. AI can alter a sample's wording only; it cannot turn content into a verified claim.

## Allowed content

The reviewed local library may include a generic role title, neutral professional summary, example responsibilities, high-level skill categories, project structures, education placeholders, certification placeholders, and non-functional contact/link placeholders. Copy must remain understandable in Arabic and English without inventing numerical performance claims.

| Safe category      | Example pattern                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Identity           | `اسمك الكامل` / `Your Full Name`                                                                                                         |
| Contact            | `example@email.com`, `05XXXXXXXX`, `linkedin.com/in/your-name`                                                                           |
| Employer           | `اسم الشركة السابقة` / `Previous Company Name`                                                                                           |
| Education          | `اسم الجامعة` / `University Name`                                                                                                        |
| Responsibility     | “Reviewed sample entries and organised supporting documents.”                                                                            |
| Project            | “Sample project: internal request-tracking dashboard.”                                                                                   |
| Training           | “Sample software-development training certificate.”                                                                                      |
| AI-adapted wording | Fictional alternative summary, three responsibilities, four skills, project, and training placeholder with no identity or outcome claim. |

## Optional AI adaptation boundary

The optional adaptation feature is a separate, consented wording route. It does **not** receive a user's resume, custom-specialty note, contact details, job description, education, location, employer, or any other free text. A valid request contains exactly specialty ID, experience level, language, and `consent: true`.

| Control           | Required behavior                                                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consent           | The checkbox is unchecked by default and the control is disabled until the visitor actively checks it. The button press, not the checkbox alone, triggers a request. |
| Guest path        | No adaptation endpoint call is made without an authenticated session. The visitor keeps the deterministic local sample and sees a fallback disclosure.               |
| Server boundary   | The endpoint rejects missing consent and extra properties, applies the established user rate limit, and never accepts CV content.                                    |
| Prompt            | The server describes only the selected product options and prohibits names, organisations, cities, credentials, numbers, dates, links, email, and phone details.     |
| Output shape      | Exactly one summary, three responsibilities, four skills, one project, and one certificate are required as JSON.                                                     |
| Output validation | Empty, oversized, malformed, link-like, digit-containing, or employer/university/hospital-like output is rejected. No failed model text reaches the sample.          |
| Provenance        | Applied wording has `status: sample`, `source: synthetic-ai`, `requiresUserReview: true`, and `exportApproved: false`.                                               |
| Fallback          | Provider, quota, transport, parse, and safety failures retain the deterministic local profile.                                                                       |
| Logging           | Usage is recorded only as task/provider/status/token count for an authenticated user; prompts and generated content are not written to usage records.                |

> An AI-adapted field is still sample material. It is never automatically confirmed, cannot be exported as a final application document, and remains subject to the existing edit-and-confirm process.

## Prohibited content

The library, AI prompt, AI output, test fixtures, documentation, screenshots, logs, and pull-request description must not contain a real applicant's information, identity number, actual personal email or phone number, full home address, named customer, real employer claimed as a workplace, real university claimed as an education provider, awarded credential, licence number, confidential work output, or metric that presents a fictional achievement as a fact.

The generator must not use an external language model by default. It must not expose an AI key in the client, add public guest access to the authenticated endpoint, infer a user's facts, or silently replace a deterministic sample with generated wording.

## Language quality

Arabic and English copy are authored as separate professional phrasing. The English text is not a literal sentence-by-sentence translation of Arabic. Each role remains neutral and suitable for a sample without a hiring, ATS, or outcome guarantee.

## Review process

Content changes require a versioned code review, bilingual content review, synthetic-data safety check, generator smoke coverage, adaptation-contract coverage when the endpoint changes, and visual preview review. The content library remains in source because the feature has no administrative backend or database dependency. A future admin workflow must not display or collect visitor resume data.

## Incident response

If real or sensitive information enters the library, AI output accepted by validation, test fixtures, browser artifacts, logs, or pull-request description, remove it immediately, rotate any affected exposed credential if applicable, invalidate generated artifacts, add a regression assertion, and document the remediation in the PR.
