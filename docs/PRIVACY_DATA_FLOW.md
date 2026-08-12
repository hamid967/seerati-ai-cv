# Privacy Data Flow

## Anonymous session

| Stage              | Data location                 | Default behavior                    | Deletion                                                           |
| ------------------ | ----------------------------- | ----------------------------------- | ------------------------------------------------------------------ |
| Editing            | React state and module memory | Enabled                             | Reload, explicit deletion, export completion, or inactivity expiry |
| Recovery           | `sessionStorage`              | Disabled until explicit consent     | Session end, explicit deletion, or consent removal                 |
| Cloud database     | Supabase                      | Never used for anonymous CVs        | Not applicable                                                     |
| Analytics and logs | No CV payload                 | Personal CV fields must not be sent | Redaction at boundaries                                            |

The user-facing message is: **“بيانات سيرتك لا تُحفظ. تُستخدم مؤقتاً داخل جلستك وتُحذف بعد الانتهاء.”**

Authenticated account features remain separate and are not required for creating, editing, printing, or exporting a free anonymous CV. Anonymous state is not migrated automatically after sign-in.
