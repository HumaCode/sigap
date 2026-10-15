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
        Schema::table('sites', function (Blueprint $table) {
            // 4.1 Visual Defacement Diffing
            $table->string('visual_baseline_hash', 128)->nullable()->after('dns_last_checked_at');
            $table->string('visual_last_hash', 128)->nullable()->after('visual_baseline_hash');
            $table->decimal('visual_diff_score', 5, 2)->nullable()->after('visual_last_hash');
            $table->dateTime('visual_last_checked_at')->nullable()->after('visual_diff_score');
            $table->string('visual_baseline_snapshot')->nullable()->after('visual_last_checked_at');
            $table->string('visual_last_snapshot')->nullable()->after('visual_baseline_snapshot');

            // 4.2 Port & Sensitive Exposure
            $table->json('open_ports')->nullable()->after('visual_last_snapshot');
            $table->json('sensitive_files_exposed')->nullable()->after('open_ports');
            $table->dateTime('ports_last_scanned_at')->nullable()->after('sensitive_files_exposed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sites', function (Blueprint $table) {
            $table->dropColumn([
                'visual_baseline_hash',
                'visual_last_hash',
                'visual_diff_score',
                'visual_last_checked_at',
                'visual_baseline_snapshot',
                'visual_last_snapshot',
                'open_ports',
                'sensitive_files_exposed',
                'ports_last_scanned_at',
            ]);
        });
    }
};
