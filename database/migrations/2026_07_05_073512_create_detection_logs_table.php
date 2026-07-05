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
        Schema::create('detection_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('site_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('category'); // judol, obat, hidden, newpage
            $table->text('context');
            $table->string('url_path')->nullable();
            $table->string('status')->default('new'); // new, reviewed, blocked, false_positive
            $table->string('source')->default('Internal Scanner');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detection_logs');
    }
};
