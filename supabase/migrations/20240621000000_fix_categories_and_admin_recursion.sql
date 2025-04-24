-- Description: Fix categories relationship and admin recursion issues

-- Step 1: Create categories table
create table if not exists public.categories (
    id uuid primary key default uuid_generate_v4(),
    name_en text not null,
    name_fr text not null,
    slug text unique not null,
    parent_id uuid references public.categories(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.categories is 'Product categories with bilingual support';

-- Step 2: Migrate existing category data
do $$
declare
    category_text text;
    category_id uuid;
begin
    -- Create a temporary table to store unique categories
    create temporary table temp_categories as
    select distinct category as name from public.products where category is not null;
    
    -- Insert categories into the new table
    for category_text in select name from temp_categories loop
        insert into public.categories (name_en, name_fr, slug)
        values (
            category_text, 
            category_text, -- Using same text for both languages initially
            lower(regexp_replace(category_text, '[^a-zA-Z0-9]+', '-', 'g'))
        )
        returning id into category_id;
        
        -- Update products table with new category_id
        update public.products
        set category = category_id::text
        where category = category_text;
    end loop;
    
    drop table temp_categories;
end $$;

-- Step 3: Modify products table to use proper foreign key
alter table public.products 
    alter column category type uuid using category::uuid,
    alter column category set not null,
    add constraint fk_product_category 
        foreign key (category) 
        references public.categories(id);

-- Rename column to be more explicit
alter table public.products 
    rename column category to category_id;

-- Step 4: Create indexes for categories
create index categories_slug_idx on public.categories(slug);
create index categories_parent_id_idx on public.categories(parent_id);

-- Step 5: Add updated_at trigger for categories
create trigger set_updated_at_on_categories
    before update on public.categories
    for each row
    execute function public.set_updated_at();

-- Step 6: Fix admin users recursion by simplifying policies
drop policy if exists "Admin users can view other admins" on public.admin_users;
drop policy if exists "Super admin can manage admin users" on public.admin_users;

-- Create a function to check if user is admin
create or replace function public.is_admin(user_email text)
returns boolean
language sql
security definer
set search_path = ''
as $$
    select user_email in ('sokoclick.com@gmail.com', 'pushns24@gmail.com');
$$;

-- Create simplified policies using the function
create policy "Admin users can view other admins"
on public.admin_users
for select
to authenticated
using (
    public.is_admin(auth.jwt() ->> 'email')
);

create policy "Super admin can manage admin users"
on public.admin_users
for all
to authenticated
using (
    public.is_admin(auth.jwt() ->> 'email')
)
with check (
    public.is_admin(auth.jwt() ->> 'email')
);

-- Step 7: Add RLS policies for categories
alter table public.categories enable row level security;

create policy "Anyone can view categories"
on public.categories
for select
to anon, authenticated
using (true);

create policy "Admins can manage categories"
on public.categories
for all
to authenticated
using (
    public.is_admin(auth.jwt() ->> 'email')
)
with check (
    public.is_admin(auth.jwt() ->> 'email')
); 