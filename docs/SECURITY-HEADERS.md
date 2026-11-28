# Security headers

The site sends `Cross-Origin-Opener-Policy: same-origin` so a page this site opens cannot reach back into this window. It does not send `Cross-Origin-Resource-Policy`. Images, fonts and scripts are fetched cross site by the booking app (`app.dilvon.com`), by link preview crawlers and by the editor. `same-site` would block the Dilvon app, and `cross-origin` adds nothing. This is the exception the checklist allows.
