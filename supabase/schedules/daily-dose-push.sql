-- Replace each placeholder with the project-specific value in the SQL Editor.
-- Run the Vault inserts once. Do not commit or share a filled-in copy.
select vault.create_secret(
  'https://<project-ref>.supabase.co/functions/v1/send-daily-dose',
  'daily-dose-function-url'
);

select vault.create_secret(
  '<project-anon-key>',
  'daily-dose-anon-key'
);

select vault.create_secret(
  '<same-long-random-value-as-PUSH_CRON_SECRET>',
  'daily-dose-cron-secret'  select extname, extnamespace::regnamespace as schema_name
  from pg_extension
  where extname in ('pg_cron', 'pg_net');
);

select cron.schedule(
  'daily-dose-push',
  '0 * * * *',
  $job$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'daily-dose-function-url'
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'daily-dose-anon-key'
        ),
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'daily-dose-anon-key'
        ),
        'x-cron-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'daily-dose-cron-secret'
        )
      ),
      body := '{}'::jsonb
    );
  $job$
);
