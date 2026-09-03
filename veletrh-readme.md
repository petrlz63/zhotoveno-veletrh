Vytvoř samostatnou kompaktní Next.js aplikaci pro subdoménu:

`https://veletrh.zhotoveno.cz`

## Cíl

Web bude sloužit na veletrzích a osobních prezentacích Zhotoveno. Návštěvník zadá základní kontakt a nechá si poslat připomínací e-mail s odkazy na webovou a mobilní aplikaci.

Důležité:

* Odesláním formuláře se nevytváří uživatelský účet ani firemní profil.
* Formulář neposílá žádný přihlašovací token ani speciální odkaz.
* Uživatel se později přihlásí přímo na webu nebo v aplikaci.
* Jednorázový OTP kód pouze ověří jeho přihlášení a založí session.
* Teprve po přihlášení může vytvořit a vyplnit firemní profil.

## Postup práce

1. Nejdříve projdi současnou strukturu projektu, `AGENTS.md`, použité komponenty, design tokeny, logo, fonty, formuláře, validaci, mailing a způsob nasazování.
2. V maximální možné míře použij existující komponenty a branding Zhotoveno.
3. Nevytvářej nový vizuální styl a neměň nesouvisející části projektu.
4. Pokud jde o monorepo, vytvoř samostatnou aplikaci podle jeho současné struktury.
5. Pokud projekt používá statický export na S3/CloudFront, zachovej ho a formulář napoj na existující backendové API. Nevytvářej Next.js API route, která by na statickém hostingu nefungovala.
6. Pokud projekt běží jako Node.js aplikace a má serverové routy, lze použít Next.js Route Handler.
7. Pokud existuje infrastruktura jako kód, doplň konfiguraci pro `veletrh.zhotoveno.cz`. Jinak pouze popiš potřebné DNS a deployment kroky v README.

## Vzhled stránky

Navrhni jednoduchou, důvěryhodnou a velmi kompaktní stránku podle aktuálního webu Zhotoveno.

Na mobilu a tabletu musí být hlavní obsah a celý formulář viditelný bez zbytečného scrollování. Počítej také se sdíleným tabletem přímo na veletržním stánku.

Použij:

* aktuální logo Zhotoveno,
* stávající barvy, typografii, radiusy a komponenty,
* výrazné hlavní CTA,
* dostatečně velká pole pro dotykové ovládání,
* responzivní rozložení,
* přístupné popisky, focus stavy a chybové hlášky.

Na desktopu může být vlevo stručné představení služby a vpravo formulář. Na mobilu vše zobraz pod sebou.

## Text stránky

Horní označení:

`Zhotoveno pro firmy`

Hlavní nadpis:

`Nechte si poslat připomenutí`

Úvodní text:

`Pošleme vám e-mail s odkazy na web a mobilní aplikaci. Firemní profil si potom vytvoříte v klidu.`

Pod formulář nebo nad tlačítko přidej krátké vysvětlení:

`Odesláním formuláře ještě nevytváříte účet ani firemní profil.`

## Formulář

Pole:

1. `Pracovní e-mail`

   * povinné,
   * `type="email"`,
   * vhodné autocomplete,
   * validace na klientovi i serveru.

2. `Název firmy`

   * nepovinné,
   * maximálně 150 znaků.

3. `Hlavní obor`

   * povinné,
   * přístupný select nebo combobox,
   * musí dobře fungovat na mobilu.

Použij tento seznam oborů:

* Auto-moto
* Cestování
* Chemie
* Elektrické spotřebiče
* Doprava
* Dřevo
* Elektronika
* IT, telekomunikace
* Nábytek
* Oděvy a obuv
* Papír a kancelář
* Plasty
* Poradenství
* Potravinářství
* Průmysl
* Reality
* Reklama
* Sklo
* Služby
* Sport
* Stavební materiál
* Stavebnictví
* Stroje
* Strojírenství
* Textil
* Tisk
* Výrobky
* Zdravotnictví
* Zemědělství

4. Povinné potvrzení:

`Souhlasím se zasláním informačního e-mailu o službě Zhotoveno a se zpracováním uvedených údajů pro tento účel.`

Přidej odkaz na existující zásady ochrany osobních údajů.

Hlavní tlačítko:

`Poslat připomenutí`

Během odesílání zobraz spinner a text:

`Odesíláme…`

Zabraň opakovanému kliknutí během probíhajícího requestu.

## Úspěšný stav

Po úspěšném odeslání nahraď formulář potvrzením:

Nadpis:

`Hotovo! Připomenutí jsme odeslali.`

Text:

`E-mail by měl dorazit během několika minut. Pokud ho neuvidíte, zkontrolujte také složku Hromadné nebo Spam.`

Z bezpečnostních důvodů nezobrazuj celou e-mailovou adresu. Můžeš ji částečně maskovat.

Přidej tlačítko:

`Zadat další kontakt`

To vyčistí celý formulář a připraví stránku pro dalšího návštěvníka. Je to důležité pro použití na sdíleném veletržním zařízení.

## Chybové stavy

Použij konkrétní a srozumitelné chyby:

* neplatný e-mail,
* nevybraný obor,
* nepotvrzený souhlas,
* problém s připojením,
* chyba při odesílání e-mailu.

Při technické chybě zobraz:

`Připomenutí se nepodařilo odeslat. Zkontrolujte připojení a zkuste to prosím znovu.`

Nikdy nezobrazuj falešný úspěšný stav, pokud backend požadavek nepřijal.

## Backend a data

Odeslání napoj na stávající backend a mailing Zhotoveno. Pokud projekt již používá AWS SES nebo vlastní mailer, využij současnou implementaci a nezaváděj dalšího poskytovatele.

Odesílej minimálně:

```json
{
  "email": "firma@example.cz",
  "companyName": "Název firmy",
  "industry": "Stavebnictví",
  "source": "veletrh.zhotoveno.cz",
  "eventName": "veletrh",
  "consent": true,
  "consentVersion": "1",
  "utmSource": null,
  "utmMedium": null,
  "utmCampaign": null
}
```

Čas odeslání a technická metadata vytvoř až na serveru. Název konkrétního veletrhu umožni nastavit pomocí environment proměnné nebo bezpečného konfiguračního parametru.

Pokud projekt ukládá leady, ulož také:

* e-mail,
* název firmy,
* hlavní obor,
* zdroj,
* název veletrhu,
* datum a čas souhlasu,
* verzi souhlasu,
* dostupné UTM parametry,
* stav odeslání e-mailu.

Nevypisuj osobní údaje do aplikačních logů.

Přidej serverovou validaci, honeypot a rozumnou ochranu proti spamu. Počítej ale s tím, že během veletrhu může z jednoho zařízení a jedné IP adresy legitimně přijít více formulářů za sebou. Nenastavuj proto příliš agresivní IP rate limit.

## Připomínací e-mail

Připrav responzivní HTML verzi i prostý text.

Předmět:

`Vyzkoušejte Zhotoveno pro svou firmu`

Preheader:

`Přihlaste se na webu nebo v aplikaci a vytvořte si firemní profil.`

Obsah:

Dobrý den,

děkujeme, že jste se u nás zastavili. Jak jsme slíbili, posíláme vám připomenutí služby Zhotoveno.

Otevřete Zhotoveno na webu nebo v mobilní aplikaci a přihlaste se pomocí svého e-mailu. Přihlášení potvrdíte jednorázovým kódem, který vám zašleme e-mailem.

Po přihlášení vás provedeme vytvořením firemního profilu, ve kterém doplníte údaje o firmě, své obory a specializace. Díky tomu vám budeme moci zobrazovat relevantní poptávky.

Hlavní CTA:

`Začít na webu`

Pod hlavním CTA zobraz odkazy nebo oficiální tlačítka:

* `Stáhnout v App Store`
* `Stáhnout na Google Play`

Závěr:

Těšíme se na spolupráci.

Tým Zhotoveno
Stačí poptat. Zhotoveno.

Patička:

`Tento e-mail jste obdrželi, protože jste si při osobním setkání s týmem Zhotoveno nechali zaslat připomenutí naší služby.`

URL adresy načítej z environment proměnných:

```env
NEXT_PUBLIC_ZHOTOVENO_WEB_URL=
NEXT_PUBLIC_APP_STORE_URL=
NEXT_PUBLIC_GOOGLE_PLAY_URL=
NEXT_PUBLIC_PRIVACY_URL=
FAIR_EVENT_NAME=
```

Do e-mailu nevkládej unikátní přihlašovací token. Tlačítka vedou pouze na běžný web Zhotoveno a do obchodů s aplikacemi.

## Technické požadavky

* Next.js podle verze používané v projektu
* TypeScript
* App Router, pokud ho používá stávající projekt
* serverová i klientská validace, ideálně přes již používanou knihovnu
* žádné hardcodované produkční URL nebo přístupové údaje
* `.env.example`
* správné SEO metadata
* pro tuto účelovou stránku nastav `noindex, nofollow`
* favicon a logo ze stávajících zdrojů
* bez nových těžkých závislostí, pokud nejsou potřeba
* žádné ukládání e-mailu do localStorage
* analytické události bez osobních údajů: `form_view`, `form_submit`, `form_success`, `form_error`
* analytiku přidej jen tehdy, pokud už ji projekt používá

## Ověření

Otestuj minimálně:

* validní odeslání,
* neplatný e-mail,
* prázdný obor,
* nepotvrzený souhlas,
* opakované kliknutí,
* chybu backendu,
* reset po úspěchu,
* zobrazení na šířkách 390 px, 768 px a 1440 px,
* ovládání klávesnicí,
* produkční build.

Spusť dostupný lint, typecheck, testy a build. Oprav chyby způsobené změnou.

Nakonec stručně vypiš:

* co bylo vytvořeno,
* které soubory byly změněny,
* jaké environment proměnné je potřeba nastavit,
* jak aplikaci lokálně spustit,
* jak ji nasadit na `veletrh.zhotoveno.cz`,
* co případně vyžaduje zásah mimo repozitář.
