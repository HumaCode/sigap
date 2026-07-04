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
        Schema::create('sites', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name');
            $table->string('url')->unique();
            $table->string('category')->default('Lainnya');
            $table->string('pic_name')->nullable();
            $table->string('pic_contact')->nullable();
            $table->integer('check_interval')->default(5);
            $table->string('sitemap_url')->nullable();
            $table->json('critical_pages')->nullable();
            $table->string('status')->default('up'); // up, down, warn, paused
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sites');
    }
};
