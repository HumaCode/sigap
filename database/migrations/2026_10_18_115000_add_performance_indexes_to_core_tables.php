<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Helper to safely add an index only if it does not already exist.
     */
    protected function addIndexSafely(string $table, array|string $columns, string $indexName): void
    {
        try {
            if (Schema::hasTable($table) && !Schema::hasIndex($table, $indexName)) {
                Schema::table($table, function (Blueprint $t) use ($columns, $indexName) {
                    $t->index($columns, $indexName);
                });
            }
        } catch (\Throwable $e) {
            // Silence if index already exists in database
        }
    }

    /**
     * Helper to safely drop an index only if it exists.
     */
    protected function dropIndexSafely(string $table, string $indexName): void
    {
        try {
            if (Schema::hasTable($table) && Schema::hasIndex($table, $indexName)) {
                Schema::table($table, function (Blueprint $t) use ($indexName) {
                    $t->dropIndex($indexName);
                });
            }
        } catch (\Throwable $e) {
            // Silence if index does not exist
        }
    }

    /**
     * Run the migrations to add high-performance composite indexes.
     */
    public function up(): void
    {
        // 1. detection_logs indexes
        $this->addIndexSafely('detection_logs', ['category', 'created_at'], 'idx_detlogs_category_created');
        $this->addIndexSafely('detection_logs', ['site_id', 'category', 'created_at'], 'idx_detlogs_site_cat_created');
        $this->addIndexSafely('detection_logs', ['created_at'], 'idx_detlogs_created_at');
        $this->addIndexSafely('detection_logs', ['status'], 'idx_detlogs_status');

        // 2. incidents indexes
        $this->addIndexSafely('incidents', ['status', 'severity'], 'idx_incidents_status_severity');
        $this->addIndexSafely('incidents', ['type', 'created_at'], 'idx_incidents_type_created');
        $this->addIndexSafely('incidents', ['detected_at'], 'idx_incidents_detected_at');
        $this->addIndexSafely('incidents', ['created_at'], 'idx_incidents_created_at');

        // 3. sites indexes
        $this->addIndexSafely('sites', ['status', 'is_active'], 'idx_sites_status_active');
        $this->addIndexSafely('sites', ['category'], 'idx_sites_category');
        $this->addIndexSafely('sites', ['updated_at'], 'idx_sites_updated_at');

        // 4. site_securities indexes
        $this->addIndexSafely('site_securities', ['score'], 'idx_site_sec_score');
        $this->addIndexSafely('site_securities', ['grade'], 'idx_site_sec_grade');

        // 5. activity_log indexes
        $this->addIndexSafely('activity_log', ['created_at'], 'idx_activity_log_created_at');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->dropIndexSafely('detection_logs', 'idx_detlogs_category_created');
        $this->dropIndexSafely('detection_logs', 'idx_detlogs_site_cat_created');
        $this->dropIndexSafely('detection_logs', 'idx_detlogs_created_at');
        $this->dropIndexSafely('detection_logs', 'idx_detlogs_status');

        $this->dropIndexSafely('incidents', 'idx_incidents_status_severity');
        $this->dropIndexSafely('incidents', 'idx_incidents_type_created');
        $this->dropIndexSafely('incidents', 'idx_incidents_detected_at');
        $this->dropIndexSafely('incidents', 'idx_incidents_created_at');

        $this->dropIndexSafely('sites', 'idx_sites_status_active');
        $this->dropIndexSafely('sites', 'idx_sites_category');
        $this->dropIndexSafely('sites', 'idx_sites_updated_at');

        $this->dropIndexSafely('site_securities', 'idx_site_sec_score');
        $this->dropIndexSafely('site_securities', 'idx_site_sec_grade');

        $this->dropIndexSafely('activity_log', 'idx_activity_log_created_at');
    }
};
