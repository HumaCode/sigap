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
            $table->string('ssh_host')->nullable()->after('is_active');
            $table->integer('ssh_port')->default(22)->after('ssh_host');
            $table->string('ssh_username')->nullable()->after('ssh_port');
            $table->string('ssh_auth_type')->default('password')->after('ssh_username'); // password or key
            $table->text('ssh_password')->nullable()->after('ssh_auth_type');
            $table->text('ssh_private_key')->nullable()->after('ssh_password');
            $table->string('ssh_app_path')->nullable()->after('ssh_private_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sites', function (Blueprint $table) {
            $table->dropColumn([
                'ssh_host',
                'ssh_port',
                'ssh_username',
                'ssh_auth_type',
                'ssh_password',
                'ssh_private_key',
                'ssh_app_path'
            ]);
        });
    }
};
