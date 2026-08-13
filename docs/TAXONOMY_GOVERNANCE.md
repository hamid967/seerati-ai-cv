# Taxonomy Governance

## Status

`seerati-career-taxonomy` is an internal, non-governmental, advisory vocabulary. It must never be described as an official Saudi occupational classification, licensing directory, or hiring authority.

## Change control

Every change requires a version increment, a change note, a reviewer, and a reviewed-at timestamp. A patch version covers corrections that do not change meaning. A minor version adds non-breaking terms. A major version changes identifiers or semantics and requires fixture migration.

Each term must contain an Arabic label, English label, synonyms, source classification, and review date. Regulatory, licensing, employment-law, or government terminology requires a dated authoritative source and a separate decision record. Unsupported or ambiguous terms remain excluded rather than being guessed.

## Quality and safety

Taxonomy matches are advisory evidence only. They cannot create a user fact, skill, certification, employer, or experience. A match result must retain the query, term ID, taxonomy version, match type, and evidence IDs. No taxonomy term may be logged together with a user's resume text.

## Review process

A proposed term is checked for duplicate identifiers, language quality, misleading claims, and accidental regulatory meaning. Arabic and English labels are reviewed independently. Terms that could imply official classification are rejected or explicitly qualified.

## Distribution

The taxonomy should be loaded by sector when possible. Initial bundle inclusion requires a measured performance justification. Local tests use synthetic queries and do not include personal resumes or job descriptions. Removal of a term requires a deprecation note and a compatibility alias where an existing saved profile depends on its identifier.
