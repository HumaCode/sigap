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
        Schema::create('scheduled_maintenances', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled'])->default('scheduled')->index();
            $table->dateTime('start_time')->index();
            $table->dateTime('end_time')->index();
            $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('scheduled_maintenance_site', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('maintenance_id')->constrained('scheduled_maintenances')->cascadeOnDelete();
            $table->foreignUlid('site_id')->constrained('sites')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['maintenance_id', 'site_id']);
        });

        Schema::create('status_subscribers', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->enum('type', ['email', 'whatsapp'])->default('email')->index();
            $table->string('contact')->index();
            $table->foreignUlid('site_id')->nullable()->constrained('sites')->nullOnDelete();
            $table->boolean('is_active')->default(true)->index();
            $table->string('verification_token')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('status_subscribers');
        Schema::dropIfExists('scheduled_maintenance_site');
        Schema::dropIfExists('scheduled_maintenances');
    }
};
