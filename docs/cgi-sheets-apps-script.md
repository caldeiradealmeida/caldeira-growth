# CGI Sheets Apps Script

## Header handling

`google-apps-script.js` defines the expected CGI columns in `CGI_HEADERS`.

The function `ensureHeaders_(sheet, headers)` compares the current first row with
the configured headers and appends any missing header at the end of the sheet.
`appendMappedRow_(sheet, headers, rowObject)` calls `ensureHeaders_` before
writing and then maps values by header name.

This means missing columns are created automatically when the current Apps Script
deployment runs. Values are not shifted by column position. Existing extra
columns that are not present in the row object receive an empty value for that
submission.

Both `comentarios` and `comentario_adicional` are intentionally preserved for
compatibility. They receive the same optional respondent comment.
