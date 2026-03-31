# SmartBase A4

NestJS-basierte Backend-API für das SmartBase-Projekt (DHBW S4).

---

## Voraussetzungen

- [Docker](https://www.docker.com/) & Docker Compose
- Node.js >= 20 (nur für lokale Entwicklung ohne Docker)

---

## Schnellstart (empfohlen: Docker)

### 1. Konfiguration vorbereiten

Kopiere die Template-Datei und passe sie bei Bedarf an:

```bash
cp .env.template .env
```

> Die mitgelieferte `.env` ist bereits für den Docker-Betrieb vorkonfiguriert (`MONGO_HOST=mongodb`).
> **MQTT ist standardmässig deaktiviert** (`MQTT_ENABLED=false`).

### 2. Anwendung starten

```bash
docker compose up --build
```

Die API ist anschliessend unter `http://localhost:3000` erreichbar.

Die Swagger Doku ist unter `http://localhost:3000/swagger` verfügbar.

---

## MQTT aktivieren (optional)

Um MQTT-Unterstützung mit einem lokalen Mosquitto-Broker zu aktivieren:

1. Verwende die erweiterte Compose-Datei:

```bash
docker compose -f docker-compose-op.yml up --build
```

2. Setze in der `.env`:

```env
MQTT_ENABLED=true
MQTT_BROKER=mqtt://mosquitto:1883
```

> `docker-compose-op.yml` enthält zusätzlich den **Mosquitto MQTT-Broker** sowie **Mongo Express** (Web-UI für MongoDB unter `http://localhost:8081`).

---

## Seed-Daten (Ersteinrichtung)

Um die Datenbank mit initialen Rollen, einem Admin-Benutzer, einem Beispiel-Haushalt und drei gemockten Sensoren zu befüllen:

```bash
npm run seed
```

> Voraussetzung: MongoDB muss laufen und eine `.env`-Datei muss vorhanden sein.

Der Seeder legt folgende Daten an (idempotent — bereits vorhandene Einträge werden übersprungen):

**Rollen**

| Name    | Beschreibung                          |
|---------|---------------------------------------|
| `User`  | Standard-Benutzer mit Lesezugriff     |
| `Admin` | Administrator mit vollem Zugriff      |

**Benutzer**

| Feld       | Wert                        |
|------------|-----------------------------|
| E-Mail     | `dhbw@smartbase.de`         |
| Passwort   | `SmartbaseAdminPasswort!`   |
| Rollen     | `User`, `Admin`             |

**Haushalt**

| Name      | Owner              |
|-----------|--------------------|
| `Example` | dhbw@smartbase.de  |

**Sensoren**

| Name                           | Typ           | Raum          | IP              |
|--------------------------------|---------------|---------------|-----------------|
| Temperatur-Sensor Wohnzimmer   | `temperature` | Wohnzimmer    | `192.168.1.101` |
| Luftfeuchte-Sensor Schlafzimmer| `humidity`    | Schlafzimmer  | `192.168.1.102` |
| CO2-Sensor Küche               | `co2`         | Küche         | `192.168.1.103` |

---

## Lokale Entwicklung (ohne Docker)

### Voraussetzungen

MongoDB muss separat laufen (z. B. via `docker compose up mongodb`).

> **Wichtig:** Wenn die App lokal (ausserhalb von Docker) gestartet wird, muss `MONGO_HOST` in der `.env` auf `localhost` gesetzt werden:
>
> ```env
> MONGO_HOST=localhost
> ```
>
> Für den vollständigen Docker-Betrieb (`docker compose up`) muss der Wert `mongodb` lauten (entspricht dem Container-Namen im Docker-Netzwerk):
>
> ```env
> MONGO_HOST=mongodb
> ```

### Setup & Start

```bash
npm install
```

```bash
# Entwicklungsmodus (watch)
npm run start:dev

# Einmaliger Start
npm run start

# Produktionsmodus
npm run start:prod
```

---

## Umgebungsvariablen

Alle Variablen sind in `.env.template` dokumentiert. Die wichtigsten:

| Variable                  | Beschreibung                              | Standard                |
|---------------------------|-------------------------------------------|-------------------------|
| `MONGO_HOST`              | MongoDB-Hostname (`localhost` lokal, `mongodb` in Docker) | `mongodb` |
| `MONGO_USER`              | MongoDB-Benutzername                      | `root`                  |
| `MONGO_PASS`              | MongoDB-Passwort                          | `secret`                |
| `MONGO_DB`                | Datenbankname                             | `smartbase`             |
| `JWT_SECRET`              | Secret für JWT-Signierung                | –                       |
| `MQTT_ENABLED`            | MQTT aktivieren (`true`/`false`)          | `false`                 |
| `MQTT_BROKER`             | MQTT-Broker-URL                           | `mqtt://mosquitto:1883` |

---

## Ports

| Service       | Port   | Beschreibung                        |
|---------------|--------|-------------------------------------|
| API           | 3000   | REST-API                            |
| MongoDB       | 27017  | Datenbank                           |
| Mongo Express | 8081   | Web-UI (nur in `.optional`)         |
| Mosquitto     | 1883   | MQTT-Broker (nur in `.optional`)    |
