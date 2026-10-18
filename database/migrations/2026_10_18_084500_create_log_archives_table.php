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
        Schema::create('log_archives', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('period', 7)->index(); // e.g. '2026-09'
            $table->string('title');
            $table->unsignedInteger('activity_log_count')->default(0);
            $table->unsignedInteger('detection_log_count')->default(0);
            $table->string('pdf_path')->nullable();
            $table->unsignedBigInteger('pdf_size')->nullable();
            $table->string('csv_path')->nullable();
            $table->unsignedBigInteger('csv_size')->nullable();
            $table->string('status')->default('completed'); // completed, running, failed
            $table->text('notes')->nullable();
            $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('log_archives');
    }
};
