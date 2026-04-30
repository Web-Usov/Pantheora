---
name: openwrt-ruantiblock
description: "Operate ruantiblock on OpenWrt routers: inspect status, update lists, add/remove bypass domains, validate nft/dnsmasq integration, and apply safe changes. Uses context from openwrt/STATE.md when available."
---

# OpenWrt ruantiblock Skill

## Dependency on OpenWrt state

Before actions:
1. Read `<project_root>/openwrt/STATE.md` if present.
2. Extract SSH target and baseline service/network context.
3. If `STATE.md` is missing, continue with user-provided target and recommend creating state via `openwrt` skill workflow.

## Core tasks

- Show current status and counters.
- Add domain/IP/CIDR to user lists.
- Remove domain/IP/CIDR from user lists.
- Trigger update and validate effect.
- Diagnose failures (update errors, nft/dnsmasq mismatch, route issues).

## Safety rules

1. Never reveal secrets from configs/lists in chat.
2. Backup touched list/config before edit.
3. Apply minimal edit only.
4. Validate with `ruantiblock status` and generated files.

## Preferred list policy

- Use `/etc/ruantiblock/user_lists/list1` only for small resources:
- max 9 related domain/IP/CIDR entries per one resource group.
- Use `/etc/ruantiblock/user_lists/list2` only for large resources:
- 10+ related domain/IP/CIDR entries per one resource group.
- Group every resource block with mandatory header:
- `# Resource: <name>`
- Keep one entry per line.
- Avoid duplicates.
- Preserve comments and grouping.

## Edit procedure (mandatory)

1. Create backup of each touched list file before edit.
2. Apply list edits without reboot and without router restart.
3. Run only `/usr/bin/ruantiblock update` as post-edit apply step.
4. Validate expected presence/absence of edited domains in:
- `/tmp/dnsmasq.d/01-ruantiblock_user_instances.dnsmasq`

## Validation checklist after change

1. `/usr/bin/ruantiblock update`
2. `/usr/bin/ruantiblock status`
3. Validate domains with grep in `/tmp/dnsmasq.d/01-ruantiblock_user_instances.dnsmasq`
4. Optional targeted connectivity check from client side if user asks

## Playbooks

Use exact command sequences from:
- [ruantiblock_playbooks.md](./references/ruantiblock_playbooks.md)
