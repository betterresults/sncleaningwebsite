-- Long-form content blocks. The area pages were thin: one intro paragraph and
-- then lists, which is not enough text to rank for anything beyond the exact
-- "{service} {place}" phrase. Each entry is { heading, body: [paragraphs] } and
-- renders as its own section, so an area can carry as much genuinely useful
-- local detail as it has without changing the template.
--
-- Applied to project dkomihipebixlegygnoy on 2026-09-22. The Romford seed
-- content lives in that migration run; see the row itself for current copy.

alter table public.area_pages
  add column if not exists content_sections jsonb not null default '[]'::jsonb;

comment on column public.area_pages.content_sections is
  'Long-form sections: [{ "heading": "...", "body": ["para", "para"] }]. Keep the detail area-specific - duplicated copy across areas is what makes these read as doorway pages.';
