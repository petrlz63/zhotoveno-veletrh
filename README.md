# Zhotoveno veletrh

Samostatná Next.js aplikace pro `veletrh.zhotoveno.cz`. Ukládá veletržní kontakty do vlastní SQLite databáze a po přijetí odesílá jednorázový připomínací e-mail. Nevytváří účet, firmu, OTP ani session návštěvníka.

## Lokální start

```bash
npm install
ZHOTOVENO_MOCK_EMAILS=1 npm run dev
```

Lokální `.env.local` je záměrně nezávislý na databázi preview. Pokud existuje zkopírovaná preview konfigurace, admin používá její `REGISTRATIONS_ADMIN_KEY_HASH` a `REGISTRATIONS_SESSION_SECRET` jen jako lokální fallback. Produkce musí používat vlastní `FAIR_ADMIN_KEY_HASH`, `FAIR_ADMIN_SESSION_SECRET` a `FAIR_IP_HASH_SECRET`.

Admin je na `/admin`; není veřejně odkazovaný a odpovídá datům této aplikace.

## Environment

Vzor obsahuje `.env.example`.

- `FAIR_DB_PATH`: cesta k samostatné SQLite databázi.
- `FAIR_EVENT_NAME`: identita konkrétního veletrhu ukládaná serverem.
- `FAIR_ORIGIN`: kanonický původ pro stejný origin formulářových requestů.
- `FAIR_IP_HASH_SECRET`: HMAC tajemství pro anti-spam hash IP adresy.
- `FAIR_ADMIN_KEY_HASH`, `FAIR_ADMIN_SESSION_SECRET`: přístup do administrace.
- `BREVO_*`: odesílatel a credentials pro reálnou e-mailovou dopravu.
- `NEXT_PUBLIC_*_URL`: běžné odkazy v e-mailu, bez tokenu nebo OTP.

Kontakty se automaticky mažou po 12 měsících. Dřívější výmaz po odvolání souhlasu je nutné vyřídit přes `gdpr@zhotoveno.cz` a provést v interní správě dat.

`ZHOTOVENO_MOCK_EMAILS=1` je povoleno pouze pro lokální testování. V produkci chybějící mailer konfigurace vyústí v chybu, nikdy ve falešný úspěch.

## Kontroly

```bash
npm run lint
npm run typecheck
npm test
npm run verify:storage
npm run build
```

## Produkční nasazení

Použijte samostatný layout `/srv/zhotoveno-veletrh/{releases,current,shared}` a nikdy nemountujte preview SQLite soubor. Pro produkční deploy:

1. Vytvořte `/srv/zhotoveno-veletrh/shared/data` s vlastníkem `1001:1001` a `/srv/zhotoveno-veletrh/shared/env` s právy `0700`.
2. Vytvořte `/srv/zhotoveno-veletrh/shared/env/veletrh.env` podle `.env.example` se skutečnými hodnotami.
3. Nastavte `DEPLOY_SHA` na přesný commit, spusťte `scripts/preflight-prod.sh`, pak `docker compose -f docker-compose.prod.yml build` a `up -d`.
4. Přidejte samostatný Caddy site pro `veletrh.zhotoveno.cz`, který proxyuje `zhotoveno-veletrh:3013`, zahoďte klientem dodané `X-Forwarded-For` a nastavte důvěryhodnou IP klienta; Caddy validujte před reloadem.
5. Přidejte samostatný SQLite-aware backup přes `sqlite3 .backup`, integrity check a health timer. Neprovádějte kopii pouze hlavního SQLite souboru během zápisu ve WAL režimu.

Před veřejnou aktivací ověřte HTTPS, `/api/health`, odeslání na testovací adresu, admin a obnovu zálohy.
