-- Aligns cgi_funnel_events_name_chk with ALLOWED_CGI_EVENTS (api/_cgi-validation.ts).
-- The constraint was missing 'cgi_company_context_submitted' and 'cgi_phone_submitted',
-- both already accepted and inserted by the application code, causing
-- insert_funnel_event to fail (23514) for those two event names.
-- No columns, data, or other constraints are touched. All 13 previously allowed
-- values are preserved, so no existing row can violate the new constraint.

alter table public.cgi_funnel_events
  drop constraint cgi_funnel_events_name_chk;

alter table public.cgi_funnel_events
  add constraint cgi_funnel_events_name_chk
  check (event_name = any (array[
    'cgi_landing_view',
    'cgi_start_click',
    'cgi_lead_form_view',
    'cgi_lead_submitted',
    'cgi_company_context_submitted',
    'cgi_phone_submitted',
    'cgi_assessment_started',
    'cgi_progress',
    'cgi_assessment_completed',
    'cgi_result_viewed',
    'cgi_report_requested',
    'cgi_cta_clicked',
    'cgi_assessment_resumed',
    'cgi_validation_error',
    'cgi_system_error'
  ]::text[]));
