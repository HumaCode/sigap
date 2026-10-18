<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to add high-performance composite indexes.
     */
    public function up(): void
    {
        // 1. detection_logs indexes
        Schema::table('detection_logs', function (Blueprint $table) {
            $table->index(['category', 'created_at'], 'idx_detlogs_category_created');
            $table->index(['site_id', 'category', 'created_at'], 'idx_detlogs_site_cat_created');
            $table->index(['created_at'], 'idx_detlogs_created_at');
            $table->index(['status'], 'idx_detlogs_status');
        });

        // 2. incidents indexes
        Schema::table('incidents', function (Blueprint $table) {
            $table->index(['status', 'severity'], 'idx_incidents_status_severity');
            $table->index(['type', 'created_at'], 'idx_incidents_type_created');
            $table->index(['detected_at'], 'idx_incidents_detected_at');
            $table->index(['created_at'], 'idx_incidents_created_at');
        });

        // 3. sites indexes
        Schema::table('sites', function (Blueprint $table) {
            $table->index(['status', 'is_active'], 'idx_sites_status_active');
            $table->index(['category'], 'idx_sites_category');
            $table->index(['updated_at'], 'idx_sites_updated_at');
        });

        // 4. site_securities indexes
        Schema::table('site_securities', function (Blueprint $table) {
            $table->index(['score'], 'idx_site_sec_score');
            $table->index(['grade'], 'idx_site_sec_grade');
        });

        // 5. activity_log indexes
        if (Schema::hasTable('activity_log')) {
            Schema::table('activity_log', function (Blueprint $table) {
                $table->index(['created_at'], 'idx_activity_log_created_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detection_logs', function (Blueprint $table) {
            $table->dropIndex('idx_detlogs_category_created');
            $table->dropIndex('idx_detlogs_site_cat_created');
            $table->dropIndex('idx_detlogs_created_at');
            $table->dropIndex('idx_detlogs_status');
        });

        Schema::table('incidents', function (Blueprint $table) {
            $table->dropIndex('idx_incidents_status_severity');
            $table->dropIndex('idx_incidents_type_created');
            $table->dropIndex('idx_incidents_detected_at');
            $table->dropIndex('idx_incidents_created_at');
        });

        Schema::table('sites', function (Blueprint $table) {
            $table->dropIndex('idx_sites_status_active');
            $table->dropIndex('idx_sites_category');
            $table->dropIndex('idx_sites_updated_at');
        });

        Schema::table('site_securities', function (Blueprint $table) {
            $table->dropIndex('idx_site_sec_score');
            $table->dropIndex('idx_site_sec_grade');
        });

        if (Schema::hasTable('activity_log')) {
            Schema::table('activity_log', function (Blueprint $table) {
                $table->dropIndex('idx_activity_log_created_at');
            });
        }
    }
};
