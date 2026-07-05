# Spesifikasi Sistem: Government Website Monitoring Platform

**Versi:** 1.0
**Tanggal:** Juli 2026
**Stack:** Laravel 13 + React (Breeze/Inertia) + PostgreSQL

---

## 1. Ringkasan Sistem

Platform monitoring untuk website instansi pemerintah/kota yang melakukan:
1. **Uptime monitoring** — deteksi server down/lambat
2. **Content integrity monitoring** — deteksi defacement (perubahan konten tak sah)
3. **Malicious injection detection** — deteksi sisipan link/keyword asing (judi online, obat-obatan ilegal, spam SEO)
4. **Security posture check** — header keamanan, file exposed, SSL
5. **Real-time alerting** — notifikasi instan ke PIC saat insiden terdeteksi

Pendekatan utama: **black-box monitoring** (crawling dari luar seperti pengunjung publik), tanpa wajib akses SSH/server.

---

## 2. Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| Backend Framework | Laravel 13 | Service/Repository/Resource/Request pattern |
| Frontend | React 18 + Inertia.js | SPA experience, no separate REST client needed |
| Auth | Laravel Breeze (React starter kit) | + Spatie Permission untuk role (Super Admin, Admin OPD, Viewer) |
| Database | PostgreSQL 16 | ULID sebagai primary key seluruh tabel |
| Queue | Laravel Queue + Horizon | Job scheduling per-domain check |
| Realtime | Laravel Reverb (WebSocket) | Broadcast status ke dashboard tanpa refresh |
| Crawler | Guzzle HTTP (default) + Laravel Dusk/Panther (untuk situs JS-heavy) | Dua mode crawl: lightweight & rendered |
| Screenshot | Browsershot (Spatie) | Bukti visual saat insiden terdeteksi |
| Notifikasi | Laravel Notification: Telegram Bot API, Fonnte/WA Gateway, Mail | Multi-channel |
| Search/Blacklist matching | Regex engine + Laravel cache (Redis) untuk keyword dictionary | Update dictionary tanpa deploy ulang |
| Diff engine | `jfcherng/php-diff` atau custom Levenshtein-based | Highlight perubahan konten |
| Styling | Bootstrap 5.3.3 + Bootstrap Icons (sesuai preferensi existing) | Bisa dikombinasi Tailwind khusus di sisi React component jika perlu |
| Hosting/Infra | VPS + Redis + Supervisor (untuk queue worker) | Horizontal scaling worker sesuai jumlah domain |

---

## 3. Arsitektur Tingkat Tinggi

```
┌─────────────────────────────────────────────────────────────┐
│                        React (Inertia)                        │
│   Dashboard │ Site Detail │ Incident Log │ Settings │ Reports │
└───────────────────────────┬────────────────────────────────┘
                             │ WebSocket (Reverb) + Inertia HTTP
┌───────────────────────────▼────────────────────────────────┐
│                     Laravel 13 App Layer                      │
│  Controllers → Services → Repositories → Eloquent Models      │
└───────────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                     ▼
┌───────────────┐   ┌────────────────┐   ┌──────────────────┐
│ Laravel Queue  │   │  Scheduler     │   │  Notification     │
│ (Horizon)      │   │  (Kernel cron) │   │  Layer            │
│                │   │                │   │                    │
│ - UptimeCheck  │   │ Dispatch job   │   │ Telegram / WA /    │
│   Job          │   │ tiap N menit   │   │ Email              │
│ - CrawlSiteJob │   │ per situs      │   │                    │
│ - DetectionJob │   │                │   │                    │
│ - ScreenshotJob│   │                │   │                    │
└───────┬────────┘   └────────────────┘   └──────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────┐
│                    Detection Engine (Services)                │
│  - KeywordMatcherService   (regex vs blacklist dictionary)    │
│  - HashComparatorService   (SHA-256 snapshot compare)          │
│  - DiffService             (content diff highlight)            │
│  - HeaderSecurityService   (CSP, X-Frame-Options, dll)         │
│  - ExposedFileService      (.env, .git, backup.sql probe)      │
│  - LinkOutboundService     (cek domain tujuan link keluar)     │
└────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────┐
│              PostgreSQL (ULID Primary Keys)                   │
└────────────────────────────────────────────────────────────┘
```

---

## 4. Alur Kerja (Workflow)

1. Admin mendaftarkan situs (URL, PIC, interval, halaman kritis opsional).
2. Sistem menjalankan **baseline crawl** — snapshot awal dianggap "bersih" (butuh approval admin bila situs sudah lama berjalan, agar tidak baseline-kan konten yang sudah terinfeksi).
3. Scheduler Laravel dispatch job tiap interval (default 5 menit untuk uptime, 30–60 menit untuk full crawl konten).
4. `UptimeCheckJob` → cek status HTTP, response time, SSL expiry.
5. `CrawlSiteJob` → ambil daftar URL dari sitemap.xml / recursive crawl (dibatasi depth & rate limit).
6. Untuk tiap halaman: hitung hash, jalankan `KeywordMatcherService` & `LinkOutboundService`.
7. Jika hash berubah **atau** keyword/link mencurigakan ditemukan → buat `Incident`, ambil `Screenshot`, kirim `Notification`.
8. Dashboard menerima broadcast realtime via Reverb → update tanpa refresh.
9. Admin OPD melakukan triase insiden (acknowledge / false positive / resolved) dari dashboard.

---

## 5. Desain Database (ERD)

Seluruh primary key menggunakan **ULID** (`Str::ulid()`), disimpan sebagai `char(26)`. Laravel 13 mendukung native lewat trait `HasUlids`.

```
┌────────────────┐        ┌──────────────────────┐        ┌─────────────────────┐
│     users       │        │   monitored_sites     │        │  critical_pages       │
├────────────────┤        ├──────────────────────┤        ├─────────────────────┤
│ id (ULID) PK    │        │ id (ULID) PK           │───┐    │ id (ULID) PK          │
│ name            │        │ name                   │   │    │ monitored_site_id FK  │
│ email           │        │ url                     │   │    │ url_path              │
│ password        │        │ category                │   │    │ label                 │
│ role            │        │ pic_name                │   │    │ check_priority        │
└────────────────┘        │ pic_contact             │   │    └─────────────────────┘
                            │ check_interval_minutes  │   │
                            │ sitemap_url             │   │
                            │ status (active/paused)  │   │
                            │ baseline_approved_at    │   │
                            │ created_at              │   │
                            └───────────┬─────────────┘   │
                                         │                  │
      ┌──────────────────────────────────┼──────────────────┼───────────────────────┐
      ▼                                  ▼                  ▼                        ▼
┌────────────────────┐   ┌─────────────────────┐  ┌──────────────────────┐  ┌────────────────────┐
│  uptime_checks       │   │  content_snapshots    │  │     incidents          │  │  security_checks     │
├────────────────────┤   ├─────────────────────┤  ├──────────────────────┤  ├────────────────────┤
│ id (ULID) PK         │   │ id (ULID) PK          │  │ id (ULID) PK           │  │ id (ULID) PK          │
│ monitored_site_id FK │   │ monitored_site_id FK  │  │ monitored_site_id FK   │  │ monitored_site_id FK  │
│ status_code          │   │ url_path              │  │ type (enum)            │  │ has_exposed_env       │
│ response_time_ms     │   │ content_hash          │  │ severity (enum)        │  │ has_exposed_git       │
│ is_up (bool)          │   │ raw_content_path       │  │ title                  │  │ missing_csp           │
│ ssl_expiry_at         │   │ is_baseline (bool)     │  │ description            │  │ missing_xframe        │
│ checked_at            │   │ checked_at             │  │ status (enum)          │  │ ssl_grade             │
└────────────────────┘   └─────────────────────┘  │ detected_flag_id FK    │  │ checked_at            │
                                                       │ screenshot_path        │  └────────────────────┘
                                                       │ acknowledged_by FK     │
                                                       │ acknowledged_at        │
                                                       │ resolved_at            │
                                                       │ created_at             │
                                                       └───────────┬────────────┘
                                                                   │
                                                                   ▼
                                                       ┌──────────────────────┐
                                                       │  detected_flags        │
                                                       ├──────────────────────┤
                                                       │ id (ULID) PK           │
                                                       │ monitored_site_id FK   │
                                                       │ content_snapshot_id FK │
                                                       │ flag_type (enum)       │
                                                       │ matched_keyword        │
                                                       │ matched_url_pattern    │
                                                       │ outbound_domain        │
                                                       │ context_snippet        │
                                                       │ url_path               │
                                                       │ created_at             │
                                                       └──────────────────────┘

┌──────────────────────┐        ┌────────────────────────┐
│  keyword_dictionary    │        │  notification_logs       │
├──────────────────────┤        ├────────────────────────┤
│ id (ULID) PK           │        │ id (ULID) PK              │
│ keyword / pattern       │        │ incident_id FK             │
│ category (judol/obat/dll)│      │ channel (wa/telegram/email)│
│ is_regex (bool)          │        │ sent_at                    │
│ is_active (bool)          │        │ status (sent/failed)        │
│ created_by FK             │        └────────────────────────┘
└──────────────────────┘
```

---

## 6. Detail Skema Tabel (Migration Blueprint)

### 6.1 `users`
```php
Schema::create('users', function (Blueprint $table) {
    $table->ulid('id')->primary();
    $table->string('name');
    $table->string('email')->unique();
    $table->timestamp('email_verified_at')->nullable();
    $table->string('password');
    $table->string('role')->default('viewer'); // super_admin, admin_opd, viewer
    $table->rememberToken();
    $table->timestamps();
});
```

### 6.2 `monitored_sites`
```php
Schema::create('monitored_sites', function (Blueprint $table) {
    $table->ulid('id')->primary();
    $table->string('name');                 // Nama OPD/instansi
    $table->string('url');                   // domain utama
    $table->string('category')->nullable();  // portal_utama, spbe, ppid, dll
    $table->string('pic_name')->nullable();
    $table->string('pic_contact')->nullable(); // no WA / email
    $table->unsignedSmallInteger('check_interval_minutes')->default(5);
    $table->string('sitemap_url')->nullable();
    $table->enum('status', ['active', 'paused'])->default('active');
    $table->timestamp('baseline_approved_at')->nullable();
    $table->ulid('created_by')->nullable();
    $table->timestamps();

    $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
});
```

### 6.3 `critical_pages`
```php
Schema::create('critical_pages', function (Blueprint $table) {
    $table->ulid('id')->primary();
    $table->foreignUlid('monitored_site_id')->constrained()->cascadeOnDelete();
    $table->string('url_path');           // /ppid/permohonan-informasi
    $table->string('label')->nullable();  // "Halaman Permohonan PPID"
    $table->enum('check_priority', ['high', 'critical'])->default('high');
    $table->timestamps();
});
```

### 6.4 `uptime_checks`
```php
Schema::create('uptime_checks', function (Blueprint $table) {
    $table->ulid('id')->primary();
    $table->foreignUlid('monitored_site_id')->constrained()->cascadeOnDelete();
    $table->unsignedSmallInteger('status_code')->nullable();
    $table->unsignedInteger('response_time_ms')->nullable();
    $table->boolean('is_up')->default(true);
    $table->timestamp('ssl_expiry_at')->nullable();
    $table->timestamp('checked_at');

    $table->index(['monitored_site_id', 'checked_at']);
});
```
> **Catatan retensi:** tabel ini akan besar cepat (tiap 5 menit × jumlah situs). Pertimbangkan partitioning per bulan atau job pembersihan data > 90 hari (simpan agregat harian saja untuk histori jangka panjang).

### 6.5 `content_snapshots`
```php
Schema::create('content_snapshots', function (Blueprint $table) {
    $table->ulid('id')->primary();
    $table->foreignUlid('monitored_site_id')->constrained()->cascadeOnDelete();
    $table->string('url_path');
    $table->string('content_hash', 64);       // SHA-256
    $table->string('raw_content_path')->nullable(); // path storage, hanya simpan jika berubah
    $table->boolean('is_baseline')->default(false);
    $table->timestamp('checked_at');

    $table->index(['monitored_site_id', 'url_path']);
});
```
> **Strategi storage:** jangan simpan raw HTML tiap kali crawl. Simpan hash selalu; raw content hanya disimpan saat hash berubah (untuk keperluan diff) — hemat storage signifikan.

### 6.6 `keyword_dictionary`
```php
Schema::create('keyword_dictionary', function (Blueprint $table) {
    $table->ulid('id')->primary();
    $table->string('keyword');
    $table->string('category'); // judol, obat_terlarang, phising, dll
    $table->boolean('is_regex')->default(false);
    $table->boolean('is_active')->default(true);
    $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
});
```
> Dikelola via UI admin, bukan hardcoded — supaya dictionary bisa terus di-update tanpa deploy.

### 6.7 `detected_flags`
```php
Schema::create('detected_flags', function (Blueprint $table) {
    $table->ulid('id')->primary();
    $table->foreignUlid('monitored_site_id')->constrained()->cascadeOnDelete();
    $table->foreignUlid('content_snapshot_id')->nullable()->constrained()->nullOnDelete();
    $table->enum('flag_type', ['keyword_match', 'outbound_link', 'hidden_text', 'new_unindexed_page']);
    $table->string('matched_keyword')->nullable();
    $table->string('matched_url_pattern')->nullable();
    $table->string('outbound_domain')->nullable();
    $table->text('context_snippet')->nullable(); // potongan teks sekitar match
    $table->string('url_path');
    $table->timestamps();
});
```

### 6.8 `incidents`
```php
Schema::create('incidents', function (Blueprint $table) {
    $table->ulid('id')->primary();
    $table->foreignUlid('monitored_site_id')->constrained()->cascadeOnDelete();
    $table->enum('type', ['downtime', 'defacement', 'injection', 'security_issue']);
    $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
    $table->string('title');
    $table->text('description')->nullable();
    $table->enum('status', ['open', 'acknowledged', 'false_positive', 'resolved'])->default('open');
    $table->foreignUlid('detected_flag_id')->nullable()->constrained()->nullOnDelete();
    $table->string('screenshot_path')->nullable();
    $table->foreignUlid('acknowledged_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('acknowledged_at')->nullable();
    $table->timestamp('resolved_at')->nullable();
    $table->timestamps();

    $table->index(['monitored_site_id', 'status']);
});
```

### 6.9 `security_checks`
```php
Schema::create('security_checks', function (Blueprint $table) {
    $table->ulid('id')->primary();
    $table->foreignUlid('monitored_site_id')->constrained()->cascadeOnDelete();
    $table->boolean('has_exposed_env')->default(false);
    $table->boolean('has_exposed_git')->default(false);
    $table->boolean('missing_csp')->default(false);
    $table->boolean('missing_xframe')->default(false);
    $table->string('ssl_grade')->nullable();
    $table->timestamp('checked_at');
});
```

### 6.10 `notification_logs`
```php
Schema::create('notification_logs', function (Blueprint $table) {
    $table->ulid('id')->primary();
    $table->foreignUlid('incident_id')->constrained()->cascadeOnDelete();
    $table->enum('channel', ['whatsapp', 'telegram', 'email']);
    $table->enum('status', ['sent', 'failed'])->default('sent');
    $table->timestamp('sent_at');
});
```

---

## 7. Model Eloquent (contoh trait ULID)

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class MonitoredSite extends Model
{
    use HasUlids;

    protected $fillable = [
        'name', 'url', 'category', 'pic_name', 'pic_contact',
        'check_interval_minutes', 'sitemap_url', 'status',
        'baseline_approved_at', 'created_by',
    ];

    public function uptimeChecks()
    {
        return $this->hasMany(UptimeCheck::class);
    }

    public function contentSnapshots()
    {
        return $this->hasMany(ContentSnapshot::class);
    }

    public function incidents()
    {
        return $this->hasMany(Incident::class);
    }

    public function criticalPages()
    {
        return $this->hasMany(CriticalPage::class);
    }
}
```

---

## 8. Arsitektur Clean Code (Service, Interface, Repository, Resource, Request)

Prinsip: **Controller tidak boleh berisi logic bisnis maupun query Eloquent langsung.** Alur selalu:

```
Request (validasi input)
   → Controller (thin, orkestrasi)
      → Service (business logic, implements Interface/Contract)
         → Repository (implements Interface/Contract, akses data)
            → Eloquent Model
      → Resource (transform response ke React/Inertia)
```

Setiap **Service** dan **Repository** wajib punya **Interface (Contract)** sendiri, di-bind di `ServiceProvider` — supaya:
- Controller/Job hanya bergantung pada abstraksi (`interface`), bukan implementasi konkret → gampang di-mock saat testing
- Implementasi bisa diganti tanpa mengubah kode pemanggil (misal ganti sumber notifikasi WA dari Fonnte ke provider lain)

### 8.1 Struktur Direktori Lengkap

```
app/
├── Console/
│   └── Kernel.php                          → schedule() dispatch job per interval
│
├── Contracts/                                → SEMUA INTERFACE di sini
│   ├── Repositories/
│   │   ├── MonitoredSiteRepositoryInterface.php
│   │   ├── CriticalPageRepositoryInterface.php
│   │   ├── UptimeCheckRepositoryInterface.php
│   │   ├── ContentSnapshotRepositoryInterface.php
│   │   ├── DetectedFlagRepositoryInterface.php
│   │   ├── IncidentRepositoryInterface.php
│   │   ├── KeywordDictionaryRepositoryInterface.php
│   │   └── SecurityCheckRepositoryInterface.php
│   └── Services/
│       ├── UptimeMonitorServiceInterface.php
│       ├── CrawlerServiceInterface.php
│       ├── KeywordMatcherServiceInterface.php
│       ├── HashComparatorServiceInterface.php
│       ├── DiffServiceInterface.php
│       ├── LinkOutboundServiceInterface.php
│       ├── HiddenTextDetectorServiceInterface.php
│       ├── HeaderSecurityServiceInterface.php
│       ├── ExposedFileServiceInterface.php
│       ├── IncidentServiceInterface.php
│       └── NotifierServiceInterface.php
│
├── Repositories/                             → IMPLEMENTASI interface Repository
│   ├── MonitoredSiteRepository.php
│   ├── CriticalPageRepository.php
│   ├── UptimeCheckRepository.php
│   ├── ContentSnapshotRepository.php
│   ├── DetectedFlagRepository.php
│   ├── IncidentRepository.php
│   ├── KeywordDictionaryRepository.php
│   └── SecurityCheckRepository.php
│
├── Services/                                  → IMPLEMENTASI interface Service (business logic)
│   ├── Monitoring/
│   │   ├── UptimeMonitorService.php
│   │   └── SecurityCheckService.php
│   ├── Crawler/
│   │   ├── SitemapResolverService.php
│   │   └── PageCrawlerService.php
│   ├── Detection/
│   │   ├── KeywordMatcherService.php
│   │   ├── HashComparatorService.php
│   │   ├── DiffService.php
│   │   ├── LinkOutboundService.php
│   │   └── HiddenTextDetectorService.php
│   ├── Security/
│   │   ├── HeaderSecurityService.php
│   │   └── ExposedFileService.php
│   ├── Incident/
│   │   └── IncidentService.php               → orkestrasi buat incident + trigger notifikasi
│   └── Notification/
│       ├── TelegramNotifierService.php
│       ├── WhatsAppNotifierService.php
│       └── EmailNotifierService.php
│
├── Jobs/                                      → hanya panggil Service via interface, tidak ada logic
│   ├── UptimeCheckJob.php
│   ├── CrawlSiteJob.php
│   ├── ContentDetectionJob.php
│   ├── SecurityCheckJob.php
│   └── ScreenshotJob.php
│
├── Http/
│   ├── Controllers/                          → thin, delegasi penuh ke Service
│   │   ├── MonitoredSiteController.php
│   │   ├── CriticalPageController.php
│   │   ├── IncidentController.php
│   │   ├── KeywordDictionaryController.php
│   │   └── DashboardController.php
│   ├── Requests/                              → validasi input per action
│   │   ├── MonitoredSite/
│   │   │   ├── StoreMonitoredSiteRequest.php
│   │   │   └── UpdateMonitoredSiteRequest.php
│   │   ├── CriticalPage/
│   │   │   └── StoreCriticalPageRequest.php
│   │   ├── Incident/
│   │   │   └── UpdateIncidentStatusRequest.php
│   │   └── KeywordDictionary/
│   │       ├── StoreKeywordRequest.php
│   │       └── UpdateKeywordRequest.php
│   └── Resources/                             → transform data ke React via Inertia
│       ├── MonitoredSiteResource.php
│       ├── MonitoredSiteCollection.php
│       ├── CriticalPageResource.php
│       ├── UptimeCheckResource.php
│       ├── ContentSnapshotResource.php
│       ├── DetectedFlagResource.php
│       ├── IncidentResource.php
│       ├── IncidentCollection.php
│       └── SecurityCheckResource.php
│
├── Models/                                     → Eloquent, hanya diakses lewat Repository
│   ├── MonitoredSite.php
│   ├── CriticalPage.php
│   ├── UptimeCheck.php
│   ├── ContentSnapshot.php
│   ├── DetectedFlag.php
│   ├── Incident.php
│   ├── KeywordDictionary.php
│   ├── SecurityCheck.php
│   └── NotificationLog.php
│
├── Events/
│   └── IncidentDetected.php                    → broadcast via Reverb
│
└── Providers/
    ├── RepositoryServiceProvider.php            → binding interface ↔ implementasi Repository
    └── DomainServiceProvider.php                 → binding interface ↔ implementasi Service
```

### 8.2 Contoh Interface (Contract)

```php
// app/Contracts/Repositories/MonitoredSiteRepositoryInterface.php
namespace App\Contracts\Repositories;

use App\Models\MonitoredSite;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface MonitoredSiteRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;
    public function findById(string $ulid): ?MonitoredSite;
    public function create(array $data): MonitoredSite;
    public function update(MonitoredSite $site, array $data): MonitoredSite;
    public function delete(MonitoredSite $site): bool;
    public function activeSites(): Collection;
    public function dueForCheck(): Collection; // situs yg jatuh tempo di-check sesuai interval
}
```

```php
// app/Contracts/Services/KeywordMatcherServiceInterface.php
namespace App\Contracts\Services;

interface KeywordMatcherServiceInterface
{
    /**
     * @return array{matched: bool, flags: array}
     */
    public function scan(string $plainText, array $links, string $urlPath): array;
}
```

### 8.3 Contoh Implementasi Repository

```php
// app/Repositories/MonitoredSiteRepository.php
namespace App\Repositories;

use App\Contracts\Repositories\MonitoredSiteRepositoryInterface;
use App\Models\MonitoredSite;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class MonitoredSiteRepository implements MonitoredSiteRepositoryInterface
{
    public function __construct(protected MonitoredSite $model) {}

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->latest()->paginate($perPage);
    }

    public function findById(string $ulid): ?MonitoredSite
    {
        return $this->model->find($ulid);
    }

    public function create(array $data): MonitoredSite
    {
        return $this->model->create($data);
    }

    public function update(MonitoredSite $site, array $data): MonitoredSite
    {
        $site->update($data);
        return $site->fresh();
    }

    public function delete(MonitoredSite $site): bool
    {
        return $site->delete();
    }

    public function activeSites(): Collection
    {
        return $this->model->where('status', 'active')->get();
    }

    public function dueForCheck(): Collection
    {
        return $this->model->where('status', 'active')
            ->whereRaw("
                COALESCE(
                    (SELECT MAX(checked_at) FROM uptime_checks WHERE monitored_site_id = monitored_sites.id),
                    '1970-01-01'
                ) <= NOW() - (check_interval_minutes || ' minutes')::interval
            ")
            ->get();
    }
}
```

### 8.4 Contoh Implementasi Service (bergantung pada Interface, bukan konkret)

```php
// app/Services/Incident/IncidentService.php
namespace App\Services\Incident;

use App\Contracts\Repositories\IncidentRepositoryInterface;
use App\Contracts\Services\IncidentServiceInterface;
use App\Contracts\Services\NotifierServiceInterface;
use App\Events\IncidentDetected;
use App\Models\MonitoredSite;

class IncidentService implements IncidentServiceInterface
{
    public function __construct(
        protected IncidentRepositoryInterface $incidentRepository,
        protected NotifierServiceInterface $notifier,
    ) {}

    public function report(MonitoredSite $site, string $type, string $severity, array $payload): void
    {
        $incident = $this->incidentRepository->create([
            'monitored_site_id' => $site->id,
            'type'              => $type,
            'severity'          => $severity,
            'title'             => $payload['title'],
            'description'       => $payload['description'] ?? null,
            'detected_flag_id'  => $payload['detected_flag_id'] ?? null,
            'screenshot_path'   => $payload['screenshot_path'] ?? null,
        ]);

        event(new IncidentDetected($incident));

        $this->notifier->notify($site, $incident);
    }
}
```

> Perhatikan: `IncidentService` **tidak tahu** apakah notifikasi lewat Telegram/WA/Email — dia hanya bergantung pada `NotifierServiceInterface`. Implementasi konkretnya (`WhatsAppNotifierService`, dst.) di-resolve lewat binding di provider, dan bisa dikombinasikan jadi satu `CompositeNotifierService` yang mem-broadcast ke semua channel aktif.

### 8.5 Binding Interface ↔ Implementasi

```php
// app/Providers/RepositoryServiceProvider.php
namespace App\Providers;

use App\Contracts\Repositories\{
    MonitoredSiteRepositoryInterface,
    CriticalPageRepositoryInterface,
    UptimeCheckRepositoryInterface,
    ContentSnapshotRepositoryInterface,
    DetectedFlagRepositoryInterface,
    IncidentRepositoryInterface,
    KeywordDictionaryRepositoryInterface,
    SecurityCheckRepositoryInterface,
};
use App\Repositories\{
    MonitoredSiteRepository,
    CriticalPageRepository,
    UptimeCheckRepository,
    ContentSnapshotRepository,
    DetectedFlagRepository,
    IncidentRepository,
    KeywordDictionaryRepository,
    SecurityCheckRepository,
};
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(MonitoredSiteRepositoryInterface::class, MonitoredSiteRepository::class);
        $this->app->bind(CriticalPageRepositoryInterface::class, CriticalPageRepository::class);
        $this->app->bind(UptimeCheckRepositoryInterface::class, UptimeCheckRepository::class);
        $this->app->bind(ContentSnapshotRepositoryInterface::class, ContentSnapshotRepository::class);
        $this->app->bind(DetectedFlagRepositoryInterface::class, DetectedFlagRepository::class);
        $this->app->bind(IncidentRepositoryInterface::class, IncidentRepository::class);
        $this->app->bind(KeywordDictionaryRepositoryInterface::class, KeywordDictionaryRepository::class);
        $this->app->bind(SecurityCheckRepositoryInterface::class, SecurityCheckRepository::class);
    }
}
```

```php
// app/Providers/DomainServiceProvider.php
namespace App\Providers;

use App\Contracts\Services\{
    UptimeMonitorServiceInterface,
    CrawlerServiceInterface,
    KeywordMatcherServiceInterface,
    HashComparatorServiceInterface,
    DiffServiceInterface,
    LinkOutboundServiceInterface,
    HiddenTextDetectorServiceInterface,
    HeaderSecurityServiceInterface,
    ExposedFileServiceInterface,
    IncidentServiceInterface,
    NotifierServiceInterface,
};
use App\Services\Monitoring\UptimeMonitorService;
use App\Services\Crawler\PageCrawlerService;
use App\Services\Detection\{
    KeywordMatcherService, HashComparatorService, DiffService,
    LinkOutboundService, HiddenTextDetectorService,
};
use App\Services\Security\{HeaderSecurityService, ExposedFileService};
use App\Services\Incident\IncidentService;
use App\Services\Notification\CompositeNotifierService;
use Illuminate\Support\ServiceProvider;

class DomainServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(UptimeMonitorServiceInterface::class, UptimeMonitorService::class);
        $this->app->bind(CrawlerServiceInterface::class, PageCrawlerService::class);
        $this->app->bind(KeywordMatcherServiceInterface::class, KeywordMatcherService::class);
        $this->app->bind(HashComparatorServiceInterface::class, HashComparatorService::class);
        $this->app->bind(DiffServiceInterface::class, DiffService::class);
        $this->app->bind(LinkOutboundServiceInterface::class, LinkOutboundService::class);
        $this->app->bind(HiddenTextDetectorServiceInterface::class, HiddenTextDetectorService::class);
        $this->app->bind(HeaderSecurityServiceInterface::class, HeaderSecurityService::class);
        $this->app->bind(ExposedFileServiceInterface::class, ExposedFileService::class);
        $this->app->bind(IncidentServiceInterface::class, IncidentService::class);
        $this->app->bind(NotifierServiceInterface::class, CompositeNotifierService::class);
    }
}
```

Daftarkan kedua provider di `bootstrap/providers.php` (Laravel 13 tidak lagi pakai `config/app.php` untuk ini).

### 8.6 Contoh Form Request

```php
// app/Http/Requests/MonitoredSite/StoreMonitoredSiteRequest.php
namespace App\Http\Requests\MonitoredSite;

use Illuminate\Foundation\Http\FormRequest;

class StoreMonitoredSiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\MonitoredSite::class);
    }

    public function rules(): array
    {
        return [
            'name'                    => ['required', 'string', 'max:255'],
            'url'                     => ['required', 'url', 'unique:monitored_sites,url'],
            'category'                => ['nullable', 'string', 'in:portal_utama,spbe,ppid,lainnya'],
            'pic_name'                => ['nullable', 'string', 'max:255'],
            'pic_contact'             => ['nullable', 'string', 'max:50'],
            'check_interval_minutes'  => ['nullable', 'integer', 'min:1', 'max:1440'],
            'sitemap_url'             => ['nullable', 'url'],
            'critical_pages'          => ['nullable', 'array'],
            'critical_pages.*.url_path' => ['required_with:critical_pages', 'string'],
            'critical_pages.*.label'    => ['nullable', 'string'],
        ];
    }
}
```

### 8.7 Contoh API Resource

```php
// app/Http/Resources/MonitoredSiteResource.php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MonitoredSiteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'name'                  => $this->name,
            'url'                   => $this->url,
            'category'              => $this->category,
            'status'                => $this->status,
            'pic_name'              => $this->pic_name,
            'pic_contact'           => $this->pic_contact,
            'check_interval_minutes'=> $this->check_interval_minutes,
            'latest_uptime'         => new UptimeCheckResource($this->whenLoaded('latestUptimeCheck')),
            'open_incidents_count'  => $this->whenCounted('incidents'),
            'critical_pages'        => CriticalPageResource::collection($this->whenLoaded('criticalPages')),
            'created_at'            => $this->created_at?->toIso8601String(),
        ];
    }
}
```

### 8.8 Contoh Controller (Thin — Full Delegasi)

```php
// app/Http/Controllers/MonitoredSiteController.php
namespace App\Http\Controllers;

use App\Contracts\Repositories\MonitoredSiteRepositoryInterface;
use App\Http\Requests\MonitoredSite\StoreMonitoredSiteRequest;
use App\Http\Resources\MonitoredSiteResource;
use Inertia\Inertia;

class MonitoredSiteController extends Controller
{
    public function __construct(
        protected MonitoredSiteRepositoryInterface $monitoredSiteRepository,
    ) {}

    public function index()
    {
        $sites = $this->monitoredSiteRepository->paginate();

        return Inertia::render('Sites/Index', [
            'sites' => MonitoredSiteResource::collection($sites),
        ]);
    }

    public function store(StoreMonitoredSiteRequest $request)
    {
        $site = $this->monitoredSiteRepository->create($request->validated());

        return redirect()
            ->route('sites.show', $site)
            ->with('success', 'Situs berhasil didaftarkan, baseline crawl akan dijalankan.');
    }
}
```

Controller **tidak pernah** memanggil `MonitoredSite::create()` langsung — selalu lewat Repository. Controller juga tidak berisi logic keputusan (misal severity, matching keyword) — itu tanggung jawab Service.

### 8.9 Contoh Job (Hanya Orkestrasi via Interface)

```php
// app/Jobs/ContentDetectionJob.php
namespace App\Jobs;

use App\Contracts\Services\{
    CrawlerServiceInterface,
    KeywordMatcherServiceInterface,
    HashComparatorServiceInterface,
};
use App\Contracts\Services\IncidentServiceInterface;
use App\Models\MonitoredSite;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class ContentDetectionJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public function __construct(protected MonitoredSite $site) {}

    public function handle(
        CrawlerServiceInterface $crawler,
        HashComparatorServiceInterface $hashComparator,
        KeywordMatcherServiceInterface $keywordMatcher,
        IncidentServiceInterface $incidentService,
    ): void {
        $pages = $crawler->crawl($this->site);

        foreach ($pages as $page) {
            $hashResult = $hashComparator->compare($this->site, $page);

            if ($hashResult['changed']) {
                $incidentService->report($this->site, 'defacement', $hashResult['severity'], [
                    'title' => "Perubahan konten terdeteksi: {$page->urlPath}",
                ]);
            }

            $scan = $keywordMatcher->scan($page->plainText, $page->links, $page->urlPath);

            if ($scan['matched']) {
                $incidentService->report($this->site, 'injection', 'critical', [
                    'title' => "Sisipan konten mencurigakan: {$page->urlPath}",
                    'detected_flag_id' => $scan['flags'][0]['id'] ?? null,
                ]);
            }
        }
    }
}
```

### 8.10 Keuntungan Pola Ini untuk Project Ini

- **Testability**: `IncidentService` bisa di-unit-test dengan mock `NotifierServiceInterface` tanpa benar-benar mengirim WA/Telegram.
- **Swap implementasi gampang**: ganti provider WA (Fonnte → provider lain) cukup ubah binding di `DomainServiceProvider`, tidak sentuh Service/Job.
- **Job tetap tipis**: seluruh logic keputusan (severity, threshold, matching) ada di Service, Job cuma orkestrasi urutan panggilan.
- **Konsisten dengan pattern yang sudah biasa dipakai**: sejalan dengan arsitektur Service/Interface/Repository/Resource/Request yang sudah jadi standar di project-project sebelumnya.

---

## 9. Struktur Frontend (React + Inertia)

```
resources/js/
├── Pages/
│   ├── Dashboard/Index.jsx          → grid status semua situs, realtime
│   ├── Sites/Index.jsx              → daftar situs + form tambah
│   ├── Sites/Create.jsx             → form pendaftaran (url, PIC, halaman kritis)
│   ├── Sites/Show.jsx               → detail 1 situs: uptime chart, incident log
│   ├── Incidents/Index.jsx          → semua insiden lintas situs, filter severity
│   ├── Incidents/Show.jsx           → detail insiden: diff viewer, screenshot
│   ├── KeywordDictionary/Index.jsx  → kelola kata kunci blacklist
│   └── Settings/Notifications.jsx   → setting channel notifikasi
├── Components/
│   ├── StatusBadge.jsx
│   ├── UptimeChart.jsx              → pakai Recharts
│   ├── DiffViewer.jsx               → highlight before/after
│   └── RealtimeListener.jsx         → subscribe Laravel Echo/Reverb channel
└── Layouts/AuthenticatedLayout.jsx
```

Realtime channel contoh:
```js
Echo.private(`site.${siteId}`)
    .listen('IncidentDetected', (e) => {
        // update state, tampilkan toast alert
    });
```

---

## 10. Detection Logic — Ringkasan Alur Teknis

**Keyword/Link Injection Detection:**
1. Ambil raw HTML halaman.
2. Strip tag, ambil plain text + daftar semua `<a href>`.
3. Jalankan regex terhadap `keyword_dictionary` (case-insensitive, termasuk varian leetspeak umum seperti `sl0t`, `jud1`).
4. Cek domain tujuan tiap `<a href>` — apakah terdaftar di eksternal blacklist domain (bisa integrasi API pihak ketiga atau list manual yang di-maintain).
5. Cek pola hidden text: `style="display:none"`, `font-size:0`, warna teks = warna background.
6. Kalau ada halaman yang ter-index Google tapi tidak ada di sitemap resmi → gunakan Google Search Console API (`site:domain` search) sebagai sinyal tambahan (dijalankan job terpisah, harian).

**Defacement Detection:**
1. Hash SHA-256 dari normalized content (buang whitespace/timestamp dinamis supaya tidak false-positive).
2. Bandingkan dengan snapshot terakhir.
3. Kalau beda → jalankan `DiffService` untuk highlight bagian yang berubah, simpan raw content baru.
4. Kalau halaman termasuk `critical_pages` → severity otomatis naik ke `high`/`critical`.

---

## 11. Prioritas Pengembangan (Roadmap Bertahap)

| Fase | Fitur |
|---|---|
| **Fase 1 (MVP)** | CRUD situs, uptime check, dashboard status, notifikasi Telegram/Email |
| **Fase 2** | Content hash comparison + defacement alert + diff viewer |
| **Fase 3** | Keyword/link injection detection + dictionary management |
| **Fase 4** | Security header check + exposed file probe + SSL monitor |
| **Fase 5** | Realtime dashboard (Reverb), screenshot evidence, laporan PDF berkala |
| **Fase 6 (opsional)** | Integrasi Google Search Console API, webhook dari sisi server (Tier 2) |

---

## 12. Catatan Operasional

- **Rate limiting crawl**: beri delay antar-request per domain (1-2 detik) supaya tidak dikira serangan DDoS oleh server yang dimonitor.
- **Retensi data**: `uptime_checks` diagregasi harian setelah 90 hari; `content_snapshots` raw content hanya disimpan saat ada perubahan.
- **False positive handling**: sediakan tombol "Tandai sebagai false positive" di incident agar dictionary/rule bisa disesuaikan dari waktu ke waktu.
- **Multi-tenant ready**: struktur `created_by`/role di `users` memungkinkan tiap OPD punya akun sendiri untuk melihat situs mereka saja (scope via policy).

---

## 13. Progress Perkembangan (Task List)

### Kamus Kata Kunci (Keyword Dictionary)
- [x] Ganti dialog `confirm()` bawaan browser dengan custom `ConfirmModal` untuk hapus kata kunci.
- [x] Tampilkan efek spinner dan tulisan *"Sedang proses..."* saat menyimpan data.
- [x] Tampilkan notifikasi toast custom (`DynamicToast`) setelah operasi berhasil.
- [x] Update tabel data secara instan tanpa reload halaman penuh (*full page reload*).
- [x] Tambahkan tombol reload di breadcrumb untuk mereset filter dan pencarian secara dinamis.
- [x] Integrasikan komponen `EmptyState` yang menarik saat tidak ada kata kunci yang cocok.

### Komponen State Kosong (Empty State)
- [x] Buat komponen `EmptyState` kustom yang modern dengan ikon dan tombol aksi.
- [x] Implementasikan komponen `EmptyState` di halaman **Daftar Situs**.
- [x] Implementasikan komponen `EmptyState` di halaman **Laporan Uptime**.
- [x] Implementasikan komponen `EmptyState` di halaman **Insiden Keamanan**.
- [x] Implementasikan komponen `EmptyState` di halaman **Log Deteksi Konten**.

### Keamanan Situs (Site Security) - *Fase 4*
- [x] Migrasi database dan modeling tabel `site_securities`.
- [x] Struktur backend lengkap (Controller, Service, Repository, Resource, Request).
- [x] Implementasikan pembagian halaman di frontend menggunakan `PaginateResource`.
- [x] Desain halaman interaktif premium menggunakan React (`KeamananSitus/Index.tsx`) dan CSS terpisah (`security.css`).
- [x] Tambahkan accordion untuk detail pemeriksaan keamanan (`Partials/SecurityRow.tsx`).
- [x] Tambahkan tombol *"Pindai Ulang Semua"* di toolbar utama halaman.
- [x] Tambahkan tombol *"Pindai Ulang"* per website langsung di baris header (tanpa perlu membuka/expand accordion).
- [x] Integrasikan `EmptyState` jika data pencarian/filter kosong.
- [ ] **Implementasi mesin pemindai riil (*Actual Scan Engine*)** pada `SiteSecurityService` menggunakan HTTP client untuk memeriksa header CSP/HSTS, serta probe file `.env`/`.git` yang terekspos secara nyata.

### Real-time & Fitur Tambahan - *Fase 5 & 6*
- [ ] **Notifikasi Telegram/Email**: Integrasikan ke akun PIC instansi saat status website down/kritis.
- [ ] **Laravel Reverb (WebSocket)**: Broadcast status monitoring ke dashboard secara realtime.
- [ ] **Bukti Visual (Screenshot)**: Hubungkan modul screenshot (Browsershot) saat insiden terdeteksi.
