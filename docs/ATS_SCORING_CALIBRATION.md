# Phase 15 ATS Scoring Calibration

The current score is an explainable readiness estimate produced by Seerati's local rules. It must not be described as a hiring probability or an ATS pass guarantee.

Calibration will compare the same synthetic resume in three representations: structured data, plain text, and parsed PDF text. The expected invariants are section presence, date ordering, title/company preservation, keyword matching, and no score change caused solely by visual styling that does not affect text extraction.

Before any threshold becomes blocking, the project must collect parser-versioned results, calculate precision/recall/F1 for extraction tasks, measure repeated-run score variance, and have an owner review false positives and false negatives.
