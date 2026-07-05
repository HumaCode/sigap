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
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('site_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('type'); // defacement, down, keyword_found, error
            $table->string('severity')->default('low'); // critical, high, medium, low
            $table->string('status')->default('open'); // open, acknowledged, resolved, false_positive
            $table->text('description')->nullable();
            $table->json('payload')->nullable(); // before/after diffs, HTTP code, screenshot paths
            $table->timestamp('detected_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};
