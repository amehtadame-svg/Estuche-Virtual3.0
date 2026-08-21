#!/usr/bin/env python3
"""Extrae el esquema `public` del dump de Supabase (supabase_completo.sql)
y genera un SQL limpio listo para cargar en PostgreSQL 17 (Docker)."""
import re
import sys

DUMP = "be/supabase_completo.sql"
OUT = "db/init/01_public_schema.sql"

SKIP_FUNCTIONS = {"rls_auto_enable()"}
SKIP_FUNCTION_PREFIXES = ("fn_",)

KEEP_TYPES = {
    "TYPE", "FUNCTION", "TABLE", "SEQUENCE", "SEQUENCE OWNED BY",
    "DEFAULT", "TABLE DATA", "SEQUENCE SET", "CONSTRAINT", "INDEX",
    "FK CONSTRAINT",
}
SKIP_TYPES = {"ROW SECURITY", "PROCEDURE"}

HEADER_RE = re.compile(
    r"^-- (?:Data for )?Name: (.*?); Type: (.*?); Schema: (.*?); Owner: (.*)$"
)


def main() -> None:
    with open(DUMP, "rb") as f:
        raw = f.read()
    text = raw.replace(b"\r\n", b"\n").decode("utf-8")
    lines = text.split("\n")

    header_idx = []
    for i, line in enumerate(lines):
        if line.startswith("-- Name: ") or line.startswith("-- Data for Name: "):
            header_idx.append(i)

    objects = []
    for k, i in enumerate(header_idx):
        j = header_idx[k + 1] if k + 1 < len(header_idx) else len(lines)
        block = lines[i:j]
        m = HEADER_RE.match(block[0])
        if not m:
            continue
        name, otype, schema, owner = m.groups()
        objects.append({"name": name, "type": otype, "schema": schema, "body": block[2:]})

    selected = []
    for obj in objects:
        if obj["schema"] != "public":
            continue
        otype = obj["type"]
        if otype in SKIP_TYPES:
            continue
        if otype == "FUNCTION":
            if obj["name"] in SKIP_FUNCTIONS or obj["name"].startswith(SKIP_FUNCTION_PREFIXES):
                continue
        if otype not in KEEP_TYPES:
            continue
        selected.append(obj)

    out = []
    out.append("-- ============================================================")
    out.append("-- Esquema `public` de Estuche Virtual (migrado desde Supabase)")
    out.append("-- Generado automáticamente desde supabase_completo.sql")
    out.append("-- PostgreSQL 17 (Docker). Contiene: schema + datos.")
    out.append("-- ============================================================")
    out.append("")
    out.append("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
    out.append("")
    out.append("SET client_encoding = 'UTF8';")
    out.append("SET standard_conforming_strings = on;")
    out.append("")

    for obj in selected:
        body = [ln for ln in obj["body"]]
        while body and not body[0].strip():
            body.pop(0)
        while body and not body[-1].strip():
            body.pop()
        out.append(f"-- --- {obj['type']}: {obj['name']} ---")
        out.extend(body)
        out.append("")

    sql = "\n".join(out) + "\n"

    import os
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(sql)

    print(f"OK: {len(selected)} objetos -> {OUT}")


if __name__ == "__main__":
    sys.exit(main())
