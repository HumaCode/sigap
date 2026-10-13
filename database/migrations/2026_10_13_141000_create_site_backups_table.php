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
        Schema::create('site_backups', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('site_id')->constrained('sites')->cascadeOnDelete();
            $table->string('filename');
            $table->string('file_path');
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('backup_type')->default('manual'); // manual, scheduled, pre_mitigation
            $table->string('status')->default('completed'); // completed, running, failed, restored
            $table->text('notes')->nullable();
            $table->text('error_message')->nullable();
            $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('restored_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_backups');
    }
};
