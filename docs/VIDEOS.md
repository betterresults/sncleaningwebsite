# Job videos on the website

Before and after videos from real jobs, hosted on YouTube, shown on the site.

## Add a video
Insert one row into Supabase table `public.job_videos` (project dkomihipebixlegygnoy):

| column | what to put |
| --- | --- |
| youtube_id | the 11 character id from the YouTube link (youtube.com/watch?v=**XXXXXXXXXXX** or youtu.be/**XXXXXXXXXXX**) |
| title | short title, e.g. "End of tenancy clean in Romford: kitchen and bathroom" |
| description | optional, one or two sentences |
| service_slug | services.slug, e.g. end-of-tenancy-cleaning, deep-house-cleaning, domestic-cleaning, airbnb-cleaning, after-builders-cleaning, carpet-cleaning-services, upholstery-cleaning, mattress-cleaning |
| district | postcode district only, e.g. RM7 (never a full postcode) |
| town | place name shown on the card, e.g. Romford |
| recorded_on | date of the job (newest show first) |
| published | true (set false to hide) |

```sql
insert into job_videos (youtube_id, title, service_slug, district, town, recorded_on)
values ('XXXXXXXXXXX', 'End of tenancy clean in Romford', 'end-of-tenancy-cleaning', 'RM7', 'Romford', '2026-11-03');
```

Then rebuild the site (push an empty commit to main). Videos appear on the next build.

## Where videos show
- Service page (e.g. /end-of-tenancy-cleaning/) and its Why us page (/why-us/end-of-tenancy-cleaning/): the 3 newest videos for that service, with "View all" when there are more than 3.
- /videos/{service_slug}/: every video for that service. The page exists only when the service has at least one video.
- Area pages (e.g. /end-of-tenancy-cleaning/romford/): videos for that service whose district is in the page's postcodes list.
- The section is hidden when no video matches. Each video also gets VideoObject schema for Google.

Code: lib/videos.js, views/partials/job-videos.ejs, views/videos.ejs, data/content.js (getJobVideos).
