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
        Schema::table('sites', function (Blueprint $table) {
            // SSL Certificate Health Tracking
            $table->string('ssl_status', 30)->nullable()->after('status')->index(); // valid, expiring, expired, invalid, self_signed
            $table->string('ssl_issuer')->nullable()->after('ssl_status');
            $table->timestamp('ssl_valid_to')->nullable()->after('ssl_issuer');
            $table->integer('ssl_days_left')->nullable()->after('ssl_valid_to');
            $table->timestamp('ssl_last_checked_at')->nullable()->after('ssl_days_left');
            $table->integer('ssl_alert_sent_milestone')->nullable()->after('ssl_last_checked_at');

            // Domain & DNS Health Tracking
            $table->string('domain_name')->nullable()->after('ssl_alert_sent_milestone')->index();
            $table->timestamp('domain_expires_at')->nullable()->after('domain_name');
            $table->integer('domain_days_left')->nullable()->after('domain_expires_at');
            $table->string('domain_registrar')->nullable()->after('domain_days_left');
            $table->string('domain_status', 30)->nullable()->after('domain_registrar'); // active, expiring, expired, unknown
            $table->timestamp('domain_last_checked_at')->nullable()->after('domain_status');
            $table->integer('domain_alert_sent_milestone')->nullable()->after('domain_last_checked_at');
            $table->json('dns_name_servers')->nullable()->after('domain_alert_sent_milestone');
            $table->json('dns_records')->nullable()->after('dns_name_servers');
            $table->timestamp('dns_last_checked_at')->nullable()->after('dns_records');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sites', function (Blueprint $table) {
            $table->dropColumn([
                'ssl_status',
                'ssl_issuer',
                'ssl_valid_to',
                'ssl_days_left',
                'ssl_last_checked_at',
                'ssl_alert_sent_milestone',
                'domain_name',
                'domain_expires_at',
                'domain_days_left',
                'domain_registrar',
                'domain_status',
                'domain_last_checked_at',
                'domain_alert_sent_milestone',
                'dns_name_servers',
                'dns_records',
                'dns_last_checked_at',
            ]);
        });
    }
};
