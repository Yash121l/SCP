import { query } from "./db.js";

export async function createSchema() {
  await query(`
    create table if not exists roles (
      id text primary key,
      label text not null,
      short_label text not null,
      name text not null,
      organization text not null,
      scope text not null,
      accent text not null,
      permissions text[] not null
    );

    create table if not exists institutions (
      id text primary key,
      type text not null,
      name text not null,
      region text not null,
      owner text not null,
      schools integer not null,
      students integer not null,
      teachers integer not null,
      projects integer not null,
      health integer not null,
      report_status text not null,
      risk text not null
    );

    create table if not exists projects (
      id text primary key,
      title text not null,
      school text not null,
      incubator text not null,
      owner text not null,
      mentor text not null,
      stage text not null,
      score integer not null,
      status text not null,
      risk text not null,
      next_action text not null,
      due_date date not null
    );

    create table if not exists approvals (
      id text primary key,
      title text not null,
      module text not null,
      owner text not null,
      requester_role text not null,
      status text not null,
      priority text not null,
      age text not null,
      approved_at timestamptz
    );

    create table if not exists resources (
      id text primary key,
      title text not null,
      type text not null,
      version text not null,
      audience text not null,
      owner text not null,
      access text not null,
      updated_at date not null
    );

    create table if not exists reports (
      id text primary key,
      name text not null,
      cadence text not null,
      owner text not null,
      status text not null,
      coverage integer not null,
      generated_count integer not null default 0
    );

    create table if not exists audit_events (
      id bigserial primary key,
      actor text not null,
      role text not null,
      event text not null,
      module text not null,
      created_at timestamptz not null default now()
    );
  `);
}
