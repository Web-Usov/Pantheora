---
name: openwrt
description: Universal OpenWrt operations skill. Use for audits, diagnostics, and configuration work on OpenWrt routers. Maintains a local STATE.md with environment-specific context (router IP, access method, key services, network topology, and operational notes).
---

# OpenWrt Universal Skill

Use this skill for any OpenWrt task.

## Purpose

- Provide a consistent workflow for OpenWrt diagnostics and operations.
- Persist environment-specific context in a local `STATE.md` so future sessions do not start from zero.

## State file contract

1. State path:
- default: `<project_root>/openwrt/STATE.md`
- if unknown project root, use current working directory and create `openwrt/STATE.md`

2. Always keep sections:
- `Access`
- `Device`
- `Network`
- `Services`
- `Custom packages`
- `Security notes`
- `Last audit`

3. Update policy:
- read existing `STATE.md` first
- change only sections affected by new evidence
- keep sensitive values redacted
- write audit timestamp and evidence commands used

4. Never store secrets:
- passwords
- private keys
- preshared keys
- auth tokens

## Standard workflow

1. Load state:
- open and read `openwrt/STATE.md` if present

2. Verify connectivity:
- SSH test to target from state (or user-provided target)

3. Run scoped task:
- audit, config change, troubleshooting, etc.

4. Validate:
- service status, routes, runtime logs, command exit codes

5. Persist:
- update `STATE.md` with findings and non-sensitive deltas

## Command conventions

- Prefer non-destructive checks first.
- For config changes: backup relevant config snippet, apply minimal change, reload target service, validate.
- Use `uci show ...`, `ifstatus ...`, `ip addr/route`, `logread`, `ubus call system board`, `opkg list-installed`.

## Playbooks

For concrete command playbooks and a `STATE.md` template, read:
- [openwrt_playbooks.md](./references/openwrt_playbooks.md)

