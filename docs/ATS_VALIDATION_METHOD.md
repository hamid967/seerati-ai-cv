# Phase 15 ATS Validation Method

Seerati's ATS evaluation is advisory and rule-based. It does not query or guarantee any external ATS vendor. The validation surface covers structured resume data, plain-text export, and PDF-parsed output.

The test dimensions are contact/section/date/title/company/skill extraction, Arabic/English/mixed text, keyword matching, duplicate detection, table/column risk, headers/footers, and score stability. Each finding must map to an explicit rule and explain the deduction.

The fixture phase provides synthetic job descriptions and expected keywords. A future parser comparison must use the same synthetic cases and record parser version, input representation, output hash, precision/recall/F1, and disagreements. No user resume may be sent to an external parser without explicit consent.

Every user-facing score must retain the disclaimer that ATS results are advisory and can differ across systems.
