# Sample-to-Verified Flow

## Field contract

The generator assigns metadata to every material sample field. The metadata is separate from the rendered resume content and is retained only with the transient sample resume in same-tab memory.

```ts
type SampleField = {
  value: string;
  status: "sample" | "user-confirmed";
  source: "synthetic-template" | "user";
  requiresUserReview: boolean;
  exportApproved: boolean;
};
```

A newly generated field always has `status: "sample"`, `source: "synthetic-template"`, `requiresUserReview: true`, and `exportApproved: false`. It must never be promoted automatically because the editor opened, the visitor signed in, a route changed, an ATS screen rendered, or a template changed.

## Guided review sequence

The editor displays **Your data readiness** above the editable sections. It identifies the next required core field, beginning with identity and target role, then professional summary, then the first experience or education entry. The visitor edits the underlying field in the existing editor and checks an acknowledgement confirming that the replacement is their verified information.

The system reads the current editor value before changing metadata. If the current value still equals the original placeholder, the system rejects the confirmation and displays an accessible error. An acknowledgement alone therefore cannot convert synthetic data into a user-confirmed fact.

| Stage            | Data behavior                                                                    | Export behavior                                             |
| ---------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Fully sample     | All generated fields are `sample`                                                | Final export blocked; labelled sample download is available |
| Editing started  | The visitor changes content but has not explicitly confirmed the next core field | Final export remains blocked                                |
| Needs review     | One or more fields are confirmed but unresolved samples remain                   | Final export remains blocked                                |
| Ready for check  | Core fields are confirmed; non-core sample fields may remain                     | The UI continues to require review before final export      |
| Ready for export | All tracked fields are `user-confirmed` and export-approved                      | Existing final export controls may proceed                  |

## Manual, not automatic

The initial implementation deliberately does not infer truth from typing. The visitor must first replace a core field and then explicitly confirm it. The feature does not send the replacement to Noura AI, ATS matching, a job tracker, a cover-letter generator, analytics, or a database as part of confirmation.

## Deletion and expiry

Deleting a `sample-` resume removes its transient-memory record. A browser refresh, closing the tab, signing out, or calling the existing guest-session deletion action also removes the same-tab sample. The sample has no default recovery path and is excluded from the explicit guest-to-account migration flow.
