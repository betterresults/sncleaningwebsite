# UTM naming

Use these rules on links that point at this website from somewhere else. Keep every value in lowercase. Use underscores, not hyphens.

- `utm_source` is the platform: google, meta, openai, gbp, bing, the directory name, or email.
- `utm_medium` is one of: cpc, paid_social, organic, referral, email, profile.
- `utm_campaign` is `service_area_yyyy_mm`. For example, `eot_london_2026_11`.
- `utm_content` is the ad or the link variant.

Never put UTM parameters on internal links. The canonical tag stays the clean page address. A visit to `/?utm_source=x` is served with the clean canonical. `/go/` pages keep recording click ids.
