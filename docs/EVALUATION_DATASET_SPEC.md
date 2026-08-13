# Phase 15 Evaluation Dataset Specification

## Version and scope

Dataset version `phase15-v1` contains **300 deterministic synthetic cases** for fixture/schema evaluation. It is not a human-labeled production benchmark and does not prove AI quality or ATS accuracy.

| Dimension              | Distribution |
| ---------------------- | -----------: |
| Arabic                 |          100 |
| English                |          100 |
| Bilingual              |          100 |
| Career levels          |       5 × 60 |
| Saudi-relevant sectors |      10 × 30 |

Each case contains a synthetic resume, synthetic job description, facts that must be preserved, missing facts that must not be invented, expected sections and keywords, acceptable rewrite guidance, forbidden claims, a synthetic sensitive marker, expected ATS findings, and expected safety behavior.

## Reproducibility

The generator is `scripts/phase15-generate-eval-dataset.mjs`. It uses deterministic index-based selection and no random seed or external service. The current dataset SHA-256 is `ae168ddc24f3b5c8e620b51e930fa9ee2b08ac85b9287dca17484ac573dc0b15`.

The fixture validator is `scripts/phase15-evaluate-fixtures.mjs`. It checks count, distributions, synthetic naming, required anchors, forbidden claims, sensitive telemetry flags, and safety expectations.
