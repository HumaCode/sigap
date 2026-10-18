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
        Schema::table('log_archives', function (Blueprint $table) {
            if (!Schema::hasColumn('log_archives', 'incident_count')) {
                $table->unsignedInteger('incident_count')->default(0)->after('detection_log_count');
            }
            if (!Schema::hasColumn('log_archives', 'scope')) {
                $table->string('scope', 20)->default('all')->after('title');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('log_archives', function (Blueprint $table) {
            if (Schema::hasColumn('log_archives', 'incident_count')) {
                $table->dropColumn('incident_count');
            }
            if (Schema::hasColumn('log_archives', 'scope')) {
                $table->dropColumn('scope');
            }
        });
    }
};
