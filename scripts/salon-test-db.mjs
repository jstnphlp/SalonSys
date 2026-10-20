import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFile, readdir } from "node:fs/promises";

// Real PostgreSQL, with minimal Supabase-owned schemas for isolated domain tests.
// This does not replace testing GoTrue, PostgREST, Storage or deployment advisors.
export async function salonTestDb() {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage; create schema extensions;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,owner_id text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
    grant usage on schema public,auth,storage to authenticated;
    grant execute on function auth.uid(), storage.foldername(text) to authenticated;
    grant select,insert,update,delete on storage.objects to authenticated;
  `);
  for (const file of (await readdir("supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    try {
      await db.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
    } catch (error) {
      await db.close();
      throw new Error(`Migration ${file}: ${error.message}`, { cause: error });
    }
  }
  return db;
}

export async function seedSalonDemo(db) {
  await db.exec(`
 create extension if not exists pgcrypto with schema extensions;
 alter table auth.users add column instance_id uuid,add column aud text,add column role text,
 add column encrypted_password text,add column email_confirmed_at timestamptz,
 add column raw_app_meta_data jsonb,add column created_at timestamptz,add column updated_at timestamptz,
 add column confirmation_token text,add column email_change text,add column email_change_token_new text,add column recovery_token text;
 create table auth.identities(provider_id text,user_id uuid,identity_data jsonb,provider text,last_sign_in_at timestamptz,created_at timestamptz,updated_at timestamptz);
 set search_path=public,extensions;
 `);
  await db.exec(await readFile("supabase/seed.sql", "utf8"));
  await db.exec("reset search_path");
}
