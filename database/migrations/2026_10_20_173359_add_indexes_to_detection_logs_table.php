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
        Schema::table('detection_logs', function (Blueprint $table) {
            $table->index(['category', 'created_at']);
            $table->index(['site_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detection_logs', function (Blueprint $table) {
            $table->dropIndex(['category', 'created_at']);
            $table->dropIndex(['site_id', 'created_at']);
        });
    }
};
