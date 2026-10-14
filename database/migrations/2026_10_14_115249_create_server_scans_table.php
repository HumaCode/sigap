<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('server_scans', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('site_id')->constrained('sites')->cascadeOnDelete();
            $table->string('scan_mode')->default('deep'); // deep, quick, git
            $table->string('threat_level')->default('clean'); // critical, high, warning, clean
            $table->string('risk_summary')->nullable();
            $table->unsignedInteger('total_scanned')->default(0);
            $table->unsignedInteger('total_findings')->default(0);
            $table->json('findings')->nullable();
            $table->string('app_path')->nullable();
            $table->foreignUlid('scanned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['site_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('server_scans');
    }
};
