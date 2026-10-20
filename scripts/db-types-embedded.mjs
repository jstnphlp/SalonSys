// Fallback generator from the actual migrated PostgreSQL catalog, never SQL-text
// inference. Use `pnpm db:types` against the Supabase stack before deployment.
import { writeFile } from "node:fs/promises";
import { salonTestDb } from "./salon-test-db.mjs";
const db = await salonTestDb();
try {
  const enums = (
    await db.query(
      `select t.typname, array_agg(e.enumlabel order by e.enumsortorder) labels from pg_type t join pg_enum e on e.enumtypid=t.oid join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' group by t.typname`,
    )
  ).rows;
  const enumMap = new Map(enums.map((e) => [e.typname, e.labels]));
  const tsType = (type) => {
    if (type.endsWith("[]")) return `(${tsType(type.slice(0, -2))})[]`;
    if (enumMap.has(type))
      return enumMap.get(type).map(JSON.stringify).join(" | ");
    if (["json", "jsonb"].includes(type)) return "Json";
    if (
      [
        "integer",
        "bigint",
        "smallint",
        "numeric",
        "real",
        "double precision",
      ].includes(type) ||
      type.startsWith("numeric(")
    )
      return "number";
    if (type === "boolean") return "boolean";
    if (type === "void") return "undefined";
    return "string";
  };
  const tables = (
    await db.query(
      `select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name`,
    )
  ).rows;
  let output =
    "// Generated from migrated PostgreSQL using scripts/db-types-embedded.mjs. Do not edit.\n";
  output +=
    "export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];\nexport type Database = { public: { Tables: {\n";
  for (const { table_name: name } of tables) {
    const cols = (
      await db.query(
        `select a.attname name,format_type(a.atttypid,a.atttypmod) type,a.attnotnull required,a.attidentity identity,pg_get_expr(d.adbin,d.adrelid) def from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace left join pg_attrdef d on d.adrelid=c.oid and d.adnum=a.attnum where n.nspname='public' and c.relname=$1 and a.attnum>0 and not a.attisdropped order by a.attnum`,
        [name],
      )
    ).rows;
    output += `${JSON.stringify(name)}: {\n`;
    for (const mode of ["Row", "Insert", "Update"]) {
      output += `${mode}: {\n`;
      for (const col of cols)
        output += `${JSON.stringify(col.name)}${mode === "Update" || (mode === "Insert" && (!col.required || col.def || col.identity)) ? "?" : ""}: ${mode !== "Row" && col.identity === "a" ? "never" : tsType(col.type) + (!col.required ? " | null" : "")};\n`;
      output += "};\n";
    }
    const fks = (
      await db.query(
        `select con.conname name,rc.relname target,array(select a.attname from unnest(con.conkey) with ordinality k(id,pos) join pg_attribute a on a.attrelid=con.conrelid and a.attnum=k.id order by k.pos) cols,array(select a.attname from unnest(con.confkey) with ordinality k(id,pos) join pg_attribute a on a.attrelid=con.confrelid and a.attnum=k.id order by k.pos) refs from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace join pg_class rc on rc.oid=con.confrelid where con.contype='f' and n.nspname='public' and c.relname=$1`,
        [name],
      )
    ).rows;
    output += `Relationships: [${fks.map((f) => `{foreignKeyName:${JSON.stringify(f.name)};columns:${JSON.stringify(f.cols)};isOneToOne:false;referencedRelation:${JSON.stringify(f.target)};referencedColumns:${JSON.stringify(f.refs)}}`).join(",")}];\n};\n`;
  }
  output += "}; Views: { [_ in never]: never }; Functions: {\n";
  const functions = (
    await db.query(
      `select p.proname name,p.proargnames names,array(select format_type(t,null) from unnest(p.proargtypes) t) types,p.pronargdefaults defaults,format_type(p.prorettype,null) result from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' order by p.proname`,
    )
  ).rows;
  for (const fn of functions)
    output += `${JSON.stringify(fn.name)}: { Args: {${fn.names.map((n, i) => `${JSON.stringify(n)}${i >= fn.names.length - fn.defaults ? "?" : ""}:${tsType(fn.types[i])}`).join(";")}}; Returns: ${tsType(fn.result)} };\n`;
  output += `}; Enums: {${enums.map((e) => `${JSON.stringify(e.typname)}:${tsType(e.typname)}`).join(";")}}; CompositeTypes: { [_ in never]: never } } };\n`;
  output +=
    'export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];\n';
  output +=
    'export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];\n';
  output +=
    'export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];\n';
  output += `export const Constants = { public: { Enums: ${JSON.stringify(Object.fromEntries(enumMap))} } } as const;\n`;
  await writeFile("src/types/database.generated.ts", output);
  console.log(
    `Generated ${tables.length} tables and ${functions.length} RPC contracts from migrated embedded PostgreSQL.`,
  );
} finally {
  await db.close();
}
