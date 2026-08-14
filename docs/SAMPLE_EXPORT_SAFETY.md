# Sample Export Safety

## Safety objective

A resume containing unresolved fictional information must not be exported in a form that appears final or applicant-authored. The export gate is evaluated from `syntheticSample.fieldMap`: if any field has `exportApproved: false`, the resume remains a sample. This rule is source-neutral: deterministic fields (`synthetic-template`) and optional AI-adapted fields (`synthetic-ai`) are both unresolved samples until the visitor changes and explicitly confirms them.

## Guarded actions

On `/resumes/$id/preview`, unresolved sample metadata prevents the following actions from producing final output:

| Action                  | Behavior while sample fields remain                                      |
| ----------------------- | ------------------------------------------------------------------------ |
| Text PDF / print        | Opens the export-safety warning; does not call `window.print()`          |
| Visual image PDF        | Opens the export-safety warning; does not invoke the PDF renderer        |
| ATS plain-text download | Opens the export-safety warning; does not create an unlabelled text file |
| Copy plain text         | Opens the export-safety warning; does not write to clipboard             |

The warning explains that using fictional content may present inaccurate information. It offers four choices: cancel, return to editing and replace data, review remaining sample fields through the editor, or download a local **labelled sample**.

## Labelled sample output

The permitted pre-review download uses the filename `sample-resume-not-for-application.txt`. Its content starts with a bilingual warning that the file is a sample only and must not be used for an application before replacing it with verified details. The download is generated with `Blob` and `URL.createObjectURL`; it is not uploaded.

## Final export condition

The initial slice does not provide a bypass. Final PDF, print, copy, and unlabelled ATS-text actions become available only when all tracked sample fields are explicitly confirmed after their underlying content changed. Optional AI adaptation does not alter this condition: its summary, responsibilities, skills, project, and certificate are initially tagged `status: sample`, `source: synthetic-ai`, and `exportApproved: false`. Existing free, registration-optional export behavior applies after the condition is met.

## ATS and job-matching boundary

When an unresolved sample is active, the ATS route suppresses final content scores and keyword-match claims. It presents a message that the current view concerns template/structure compatibility only. This avoids treating generated sample responsibilities or skills as verified evidence of job fit.

## Regression coverage

The browser smoke creates a synthetic resume, attempts Text PDF export, verifies that the warning appears, and downloads the labelled sample file. It also navigates to ATS and verifies the synthetic-content boundary. The deterministic smoke verifies that applying accepted AI adaptation sets `contentMode: ai-adapted`, leaves fields in sample status, records `synthetic-ai` source, and keeps export approval false. The browser smoke additionally verifies that the AI control is disabled until consent and that a guest fallback issues no adaptation request. Tests fail if synthetic marker content reaches an outbound request, if a cloud persistence mutation occurs, or if a persistence key related to the sample is present by default.
