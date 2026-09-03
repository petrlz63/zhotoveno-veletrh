# Zhotoveno veletrh operations

Production root: `/srv/zhotoveno-veletrh`.

- Active release: `/srv/zhotoveno-veletrh/current`
- SQLite database: `/srv/zhotoveno-veletrh/shared/data/fair-reminders.sqlite`
- SQLite backup: `/var/backups/zhotoveno-veletrh`
- Backup unit: `zhotoveno-veletrh-backup.timer`
- Health unit: `zhotoveno-veletrh-health.timer`

Restore overwrites newer leads. First stop `zhotoveno-veletrh`, verify the selected archive checksum, decompress it to a temporary root-only file, run `PRAGMA integrity_check`, install it as the database with ownership `1001:1001`, then start the current Compose release and run the health check.
