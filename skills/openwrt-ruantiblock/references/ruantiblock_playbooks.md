# ruantiblock Playbooks

## Baseline inspection

```sh
ssh root@192.168.1.1 'opkg list-installed | grep -E "^ruantiblock|luci-app-ruantiblock|luci-i18n-ruantiblock"'
ssh root@192.168.1.1 'uci show ruantiblock'
ssh root@192.168.1.1 '/usr/bin/ruantiblock status; /usr/bin/ruantiblock raw-status'
ssh root@192.168.1.1 'wc -l /tmp/dnsmasq.d/00-ruantiblock_bypass.dnsmasq /tmp/dnsmasq.d/01-ruantiblock_user_instances.dnsmasq /tmp/dnsmasq.d/02-ruantiblock.dnsmasq'
```

## Add domain to bypass list (safe flow)

Example target list file: `/etc/ruantiblock/user_lists/list2`

1. Backup:
```sh
ssh root@192.168.1.1 'cp /etc/ruantiblock/user_lists/list2 /etc/ruantiblock/user_lists/list2.bak.$(date +%Y%m%d-%H%M%S)'
```

2. Append if absent:
```sh
ssh root@192.168.1.1 'grep -Fxq "example.com" /etc/ruantiblock/user_lists/list2 || echo "example.com" >> /etc/ruantiblock/user_lists/list2'
```

3. Update and validate:
```sh
ssh root@192.168.1.1 '/usr/bin/ruantiblock update'
ssh root@192.168.1.1 '/usr/bin/ruantiblock status'
```

## Remove domain from bypass list

```sh
ssh root@192.168.1.1 'cp /etc/ruantiblock/user_lists/list2 /etc/ruantiblock/user_lists/list2.bak.$(date +%Y%m%d-%H%M%S)'
ssh root@192.168.1.1 'sed -i "\\|^example.com$|d" /etc/ruantiblock/user_lists/list2'
ssh root@192.168.1.1 '/usr/bin/ruantiblock update'
ssh root@192.168.1.1 '/usr/bin/ruantiblock status'
```

## Troubleshooting quick checks

```sh
ssh root@192.168.1.1 'logread | grep -i ruantiblock | tail -n 200'
ssh root@192.168.1.1 'ls -lh /var/ruantiblock /tmp/dnsmasq.d/*ruantiblock*'
ssh root@192.168.1.1 'ifstatus awg0'
```

## Post-change state sync

After successful ruantiblock changes, update `<project_root>/openwrt/STATE.md`:
- what list changed
- update timestamp
- resulting status (`enabled/disabled`, key counters)
- no raw sensitive entries

