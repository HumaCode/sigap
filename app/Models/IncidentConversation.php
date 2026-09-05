<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IncidentConversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'incident_id',
        'user_message',
        'ai_response',
        'model_used',
        'provider',
    ];

    public function incident()
    {
        return $this->belongsTo(Incident::class);
    }
}
