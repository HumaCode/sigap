<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiRemediationService
{
    protected string $endpoint;
    protected string $apiKey;
    protected string $model;

    public function __construct()
    {
        $this->endpoint = env('NINEROUTER_API_ENDPOINT', 'https://9router.humacode.my.id/v1');
        $this->apiKey = env('NINEROUTER_API_KEY', '');
        $this->model = env('NINEROUTER_MODEL', 'combo-maut');
    }

    public function generateRemediationPlan(array $incidentData, ?string $extraContext = null, ?string $selectedModel = null, array $conversationHistory = []): array
    {
        $title = $incidentData['title'] ?? 'Insiden Keamanan';
        $siteName = $incidentData['site_name'] ?? ($incidentData['site']['name'] ?? 'Situs Terpantau');
        $siteUrl = $incidentData['site_url'] ?? ($incidentData['site']['url'] ?? '');
        $severity = $incidentData['severity'] ?? 'high';
        $description = $incidentData['description'] ?? '';
        $type = $incidentData['type'] ?? 'security';

        $modelToUse = !empty($selectedModel) ? $selectedModel : $this->model;

        $systemInstruction = "Anda adalah Pakar Cyber Security Senior & Lead Incident Responder resmi untuk SIGAP Web Pemkot Pekalongan.\n\n" .
            "ATURAN KETAT & BATASAN KEAMANAN PERCAKAPAN (STRICT GUARDRAILS):\n" .
            "1. BATASAN TOPIK INSIDEN: Anda HANYA boleh menjawab pertanyaan yang BERHUBUNGAN LANGSUNG dengan penanganan insiden ini: \"{$title}\" (Situs: {$siteName}, Tipe: {$type}, Urgensi: " . strtoupper($severity) . ").\n" .
            "2. PENOLAKAN PROMPT DILUAR TOPIK: Jika pengguna meminta hal-hal yang tidak relevan dengan keamanan/insiden ini (seperti resep makanan, lelucon, tips umum, kuis, atau pertanyaan umum di luar penanganan insiden), ANDA WAJIB MENOLAK secara sopan dengan balasan: \"Mohon maaf, saya adalah Asisten Khusus Penanganan Insiden Keamanan SIGAP. Saya hanya dapat membantu analisis & langkah mitigasi celah keamanan untuk insiden '{$title}' pada situs {$siteName}.\"\n" .
            "3. EMBARGO INFRASTRUKTUR INTERNAL: JANGAN PERNAH membocorkan atau memberikan struktur direktori asli server/proyek SIGAP ini secara detail jika diminta. Berikan hanya panduan umum pemeriksaan file berisiko tanpa mengekspos rahasia sistem.\n" .
            "4. FOKUS SOLUSI: Setiap jawaban Anda harus selalu terfokus pada investigasi, penambalan celah (patching), pembersihan script jahat, dan pemulihan situs terkait insiden ini.";

        $systemMessage = [
            'role' => 'system',
            'content' => $systemInstruction
        ];

        $messages = [$systemMessage];

        // Initial context prompt if first message
        $initialPrompt = "Insiden Keamanan:\n" .
            "- **Judul**: {$title}\n" .
            "- **Situs**: {$siteName} ({$siteUrl})\n" .
            "- **Urgensi**: " . strtoupper($severity) . "\n" .
            "- **Tipe**: {$type}\n" .
            "- **Deskripsi**: {$description}";

        $messages[] = [
            'role' => 'user',
            'content' => $initialPrompt
        ];

        // Append historical chat messages
        foreach ($conversationHistory as $chat) {
            if (!empty($chat['user_message'])) {
                $messages[] = ['role' => 'user', 'content' => $chat['user_message']];
            }
            if (!empty($chat['ai_response'])) {
                $messages[] = ['role' => 'assistant', 'content' => $chat['ai_response']];
            }
        }

        // Append current user message/question
        if (!empty($extraContext)) {
            $messages[] = ['role' => 'user', 'content' => $extraContext];
        } else if (count($conversationHistory) === 0) {
            $messages[] = [
                'role' => 'user',
                'content' => "Berikan analisis diagnosa, langkah penanganan bertahap, dan perintah shell perbaikan."
            ];
        }

        if (!empty($this->apiKey) && !str_contains($this->apiKey, '•••')) {
            try {
                $response = Http::withoutVerifying()
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type'  => 'application/json',
                ])
                ->timeout(30)
                ->post(rtrim($this->endpoint, '/') . '/chat/completions', [
                    'model' => $modelToUse,
                    'messages' => $messages,
                    'temperature' => 0.4,
                    'max_tokens' => 1500,
                ]);

                if ($response->successful()) {
                    $rawBody = trim($response->body());
                    $aiContent = null;

                    // 1. Try standard JSON response format
                    $json = json_decode($rawBody, true);
                    if (is_array($json) && isset($json['choices'][0]['message']['content'])) {
                        $aiContent = $json['choices'][0]['message']['content'];
                    }

                    // 2. If response is SSE stream (data: {"choices": [...]}), assemble delta contents
                    if (empty($aiContent) && str_contains($rawBody, 'data:')) {
                        $streamContent = '';
                        $lines = explode("\n", $rawBody);
                        foreach ($lines as $line) {
                            $line = trim($line);
                            if (str_starts_with($line, 'data:')) {
                                $dataStr = trim(substr($line, 5));
                                if ($dataStr === '[DONE]') continue;
                                $chunk = json_decode($dataStr, true);
                                if (is_array($chunk)) {
                                    $delta = $chunk['choices'][0]['delta']['content'] ?? null;
                                    if ($delta) {
                                        $streamContent .= $delta;
                                    }
                                }
                            }
                        }
                        if (!empty($streamContent)) {
                            $aiContent = $streamContent;
                        }
                    }

                    if (!empty($aiContent)) {
                        return [
                            'status' => 'success',
                            'provider' => '9router AI Engine',
                            'model' => $modelToUse,
                            'content' => $aiContent,
                        ];
                    }
                }
                
                Log::warning('9router AI API Call Unsuccessful: ' . $response->body());
            } catch (\Exception $e) {
                Log::error('9router AI Exception: ' . $e->getMessage());
            }
        }

        // High Quality Expert Fallback Template if API key is pending or offline
        return [
            'status' => 'fallback',
            'provider' => 'SIGAP Security Knowledge Base',
            'model' => 'Expert Rulebook',
            'content' => $this->generateFallbackPlan($title, $siteName, $siteUrl, $severity, $type, $extraContext),
        ];
    }

    private function generateFallbackPlan(string $title, string $siteName, string $siteUrl, string $severity, string $type, ?string $extraContext): string
    {
        // If user asks a specific follow-up question or custom prompt
        if (!empty($extraContext) && trim($extraContext) !== '') {
            $query = trim($extraContext);

            // Guardrail 1: Reject out-of-scope requests (recipes, trivia, etc)
            if (preg_match('/(resep|masak|nasi goreng|makanan|lagu|cerita|lelucon|game|presiden)/i', $query)) {
                return "### 🛡️ Batasan Keamanan Sistem SIGAP\n\n" .
                    "Mohon maaf, saya adalah **Asisten Khusus Penanganan Insiden Keamanan SIGAP**.\n\n" .
                    "Saya difokuskan **hanya** untuk membantu penanganan celah keamanan, mitigasi serangan, dan pemulihan insiden **\"{$title}\"** pada situs **{$siteName}**.";
            }

            // Guardrail 2: Refuse internal project directory structure exposure
            if (preg_match('/(struktur folder|struktur direktori|isi folder|isi direktori|tree folder)/i', $query)) {
                return "### 🔒 Kerahasiaan Struktur Sistem\n\n" .
                    "Demi alasan keamanan infrastruktur (*Information Disclosure Prevention*), struktur direktori internal proyek tidak dapat ditampilkan.\n\n" .
                    "Namun, untuk menangani insiden **{$title}**, berikut adalah direktori standar web server yang perlu Anda periksa:\n" .
                    "- `public/` : Periksa skrip `index.php` dan `.htaccess` dari manipulasi skrip asing.\n" .
                    "- `storage/` atau `uploads/` : Pastikan direktori unggahan tidak memiliki izin eksekusi file `.php`.";
            }
            
            if (preg_match('/(bisa|mengerti|paham|tau|bisa tak|bisa gak|dapat) (koding|coding|ngoding|pemrograman|program)/i', $query)) {
                return "### 💻 Kemampuan Penanganan Koding Keamanan\n\n" .
                    "Ya, saya **Asisten Pakar AI SIGAP Web** yang dilatih khusus untuk menganalisis kode (*code review*), menulis skrip perbaikan otomatis (PHP, Bash, Nginx, Apache), dan menutup celah keamanan cyber pada aplikasi web Pemkot Pekalongan.\n\n" .
                    "Saya dapat membantu Anda dalam penanganan insiden **{$title}** pada situs **{$siteName}**.";
            }

            return "### 💬 Asisten Penanganan Insiden SIGAP\n\n" .
                "Mengenai pertanyaan Anda terkait insiden **\"{$title}\"** pada situs **{$siteName}**:\n\n" .
                "Silakan berikan detail log, jenis skrip terinfeksi, atau perintah tertentu yang ingin Anda konsultasikan dalam lingkup pemulihan insiden ini.";
        }

        return "### 🎯 1. Diagnosa & Analisis Celah Keamanan\n" .
            "Insiden **{$title}** pada situs **{$siteName}** ({$siteUrl}) terindikasi sebagai celah keamanan kategori **" . strtoupper($type) . "** dengan tingkat urgensi **" . strtoupper($severity) . "**.\n\n" .
            "Celah ini umumnya dimanfaatkan oleh penyerang melalui:\n" .
            "- Eksploitasi plugin/theme tidak ter-update atau celah remote code execution.\n" .
            "- Akses file konfigurasi publik yang tidak dikunci (.env, .git, config.php).\n" .
            "- Injeksi script jahat via formulir input / XSS / SQL Injection.\n\n" .
            "---\n\n" .
            "### 📋 2. Langkah-Langkah Penanganan Bertahap\n\n" .
            "#### **Langkah 1: Isolasi Akses Publik Sementara**\n" .
            "Alihkan situs ke mode pemeliharaan (*Maintenance Mode*) atau kunci akses IP luar agar penyerang tidak dapat mengubah file lebih lanjut.\n\n" .
            "#### **Langkah 2: Pembersihan File/Kode Terinfeksi**\n" .
            "Periksa checksum integritas file utama (`index.php`, `.htaccess`, `header.php`) dan hapus script injeksi bermuatan malware/skrip judi online.\n\n" .
            "#### **Langkah 3: Penguatan Hak Akses File (Hardening)**\n" .
            "Batasi izin akses file (*File Permissions*) agar web server tidak memiliki hak akses tulis pada direktori sensitif.\n\n" .
            "#### **Langkah 4: Reset Kredensial & Rotasi API Key**\n" .
            "Ganti seluruh kata sandi admin database, akun CMS, dan rotasi secret key file `.env`.\n\n" .
            "---\n\n" .
            "### 💻 3. Rekomendasi Perintah Shell / Snippet Perbaikan\n\n" .
            "```bash\n" .
            "# 1. Kunci hak akses file sensitif .env & config\n" .
            "chmod 600 .env\n" .
            "chmod 644 index.php\n\n" .
            "# 2. Cari file PHP yang dimodifikasi dalam 48 jam terakhir\n" .
            "find /var/www/html/ -type f -name \"*.php\" -mtime -2\n\n" .
            "# 3. Kunci direktori uploads agar file script tidak dapat dieksekusi\n" .
            "<FilesMatch \"\\.(php|php5|phtml|php7)$\">\n" .
            "    Order Allow,Deny\n" .
            "    Deny from all\n" .
            "</FilesMatch>\n" .
            "```\n\n" .
            "---\n\n" .
            "### ✅ 4. Checklist Pengujian & Pemulihan (Recovery)\n" .
            "- [ ] Seluruh file script injeksi telah dihapus.\n" .
            "- [ ] File `.env` dan direktori `.git` sudah terlindungi dari akses publik.\n" .
            "- [ ] Password admin CMS dan database sudah diperbarui.\n" .
            "- [ ] Cache Varnish / Nginx / CDN sudah dibersihkan.\n" .
            "- [ ] Uji ulang situs di browser dan verifikasi di SIGAP Web.";
    }
}
