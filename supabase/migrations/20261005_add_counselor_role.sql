-- Run this statement by itself before the unified-auth migration.
-- PostgreSQL does not allow a newly added enum value to be used in the same transaction.
alter type public.user_role add value if not exists 'counselor';
