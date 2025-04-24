-- Description: Add admin audit logs table
-- Following RLS policy guidelines for Supabase

-- Create admin audit logs table
create table public.admin_audit_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id),
    action text not null check (action in ('login', 'logout', 'create', 'update', 'delete', 'view', 'approve', 'reject')),
    resource text not null check (resource in ('admin', 'user', 'product', 'slot', 'setting')),
    resource_id text,
    details jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz not null default now()
);

comment on table public.admin_audit_logs is 'Audit logs for admin actions';

-- Create indexes
create index admin_audit_logs_user_id_idx on public.admin_audit_logs(user_id);
create index admin_audit_logs_action_idx on public.admin_audit_logs(action);
create index admin_audit_logs_resource_idx on public.admin_audit_logs(resource);
create index admin_audit_logs_created_at_idx on public.admin_audit_logs(created_at);

-- Enable RLS
alter table public.admin_audit_logs enable row level security;

-- RLS Policies
create policy "Super admins can view all audit logs"
on public.admin_audit_logs
for select
to authenticated
using (
    auth.uid() in (
        select id from public.admin_users 
        where role = 'super_admin'
    )
);

create policy "Super admins can insert audit logs"
on public.admin_audit_logs
for insert
to authenticated
with check (
    auth.uid() in (
        select id from public.admin_users 
        where role = 'super_admin'
    )
);

-- Verify the table was created
do $$
begin
    assert exists(
        select from pg_tables 
        where schemaname = 'public' 
        and tablename = 'admin_audit_logs'
    ), 'admin_audit_logs table was not created properly';
    
    assert exists(
        select from pg_policies 
        where tablename = 'admin_audit_logs'
    ), 'RLS policies were not created properly';
end$$; 