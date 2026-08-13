# Adaptive Onboarding

Adaptive Onboarding asks only for the next useful context. It classifies the session as graduate, professional, leader, or unknown using explicit resume context, not nationality, location, or hidden profiling.

The question engine returns a bilingual prompt, why it is asked, the target section, whether it can be skipped, whether it sends anything to AI, and whether the answer is immediately persisted. The first wave marks all questions as local-only and non-AI. Guest answers remain in memory and can be discarded with the session.

A graduate path prioritizes target role, education, projects, and skills. A professional path prioritizes target role, evidence-backed achievement, and tools used. A leader path prioritizes target role, scope, and transformation. Unknown users receive a single persona clarification question before any specialized sequence.

The engine has no network dependency and does not silently save answers, infer protected characteristics, or force users through every question. The user may skip optional questions and stop when the profile is sufficiently useful for the selected goal.
