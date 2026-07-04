<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaginateResource extends JsonResource
{
    /**
     * @var string|null
     */
    protected $resourceClass;

    public function __construct($resource, $resourceClass = null)
    {
        parent::__construct($resource);
        $this->resourceClass = $resourceClass;
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->resourceClass
                ? $this->resourceClass::collection($this->items())
                : $this->items(),
            'meta' => [
                'current_page'  => $this->currentPage(),
                'from'          => $this->firstItem(),
                'last_page'     => $this->lastPage(),
                'path'          => $this->path(),
                'per_page'      => $this->perPage(),
                'to'            => $this->lastItem(),
                'total'         => $this->total(),
            ]
        ];
    }
}