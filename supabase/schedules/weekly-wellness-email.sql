-- Replace each placeholder with the project-specific value in the SQL Editor.
-- Store each secret once. Do not commit or share a filled-in copy.
select vault.create_secret(
  'https://<project-ref>.supabase.co/functions/v1/send-weekly-wellness-email',
  'weekly-wellness-email-function-url'
);

select vault.create_secret(
  '<project-anon-key>',
  'weekly-wellness-email-anon-key'
);

select vault.create_secret(
  '<same-long-random-value-as-WELLNESS_EMAIL_CRON_SECRET>',
  'weekly-wellness-email-cron-secret'
);

select extname, extnamespace::regnamespace as schema_name
  from pg_extension
 where extname in ('pg_cron', 'pg_net');

select cron.schedule(
  'weekly-wellness-email',
  '0 * * * *',
  $job$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'weekly-wellness-email-function-url'
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'weekly-wellness-email-anon-key'
        ),
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'weekly-wellness-email-anon-key'
        ),
        'x-cron-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'weekly-wellness-email-cron-secret'
        )
      ),
      body := '{}'::jsonb
    );
  $job$
);
