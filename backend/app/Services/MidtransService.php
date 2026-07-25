<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class MidtransService
{
    private string $serverKey;

    private bool $isProduction;

    private ?string $caBundle;

    public function __construct()
    {
        $this->serverKey = (string) config('services.midtrans.server_key');
        $this->isProduction = (bool) config('services.midtrans.is_production');
        $this->caBundle = config('services.midtrans.ca_bundle') ?: null;
    }

    private function baseUrl(): string
    {
        return $this->isProduction
            ? 'https://app.midtrans.com/snap/v1'
            : 'https://app.sandbox.midtrans.com/snap/v1';
    }

    /**
     * Creates a Snap transaction. Caller must have already computed
     * gross_amount server-side (from tbl_paket.harga) — this method does
     * not recompute or validate price.
     *
     * @return array{token: string, redirect_url: string}
     */
    public function createSnapTransaction(array $params): array
    {
        $client = Http::withBasicAuth($this->serverKey, '')->acceptJson();

        if ($this->caBundle) {
            $client = $client->withOptions(['verify' => $this->caBundle]);
        }

        $response = $client->post("{$this->baseUrl()}/transactions", $params);

        if ($response->failed()) {
            throw new \RuntimeException('Midtrans Snap request failed: '.$response->body());
        }

        return $response->json();
    }

    /**
     * SHA512(order_id + status_code + gross_amount + ServerKey), per Midtrans's
     * notification signature spec. gross_amount must be used exactly as
     * Midtrans sent it (string, e.g. "150000.00") — do not reformat before hashing.
     */
    public function verifySignature(array $notification): bool
    {
        $expected = hash('sha512',
            ($notification['order_id'] ?? '')
            .($notification['status_code'] ?? '')
            .($notification['gross_amount'] ?? '')
            .$this->serverKey
        );

        return hash_equals($expected, (string) ($notification['signature_key'] ?? ''));
    }

    /**
     * Maps Midtrans's transaction_status (+ fraud_status where relevant) onto
     * this app's 3-value status_transaksi enum (pending/paid/cancelled).
     */
    public function mapNotificationToStatus(array $notification): string
    {
        $status = $notification['transaction_status'] ?? '';
        $fraud = $notification['fraud_status'] ?? null;

        return match (true) {
            $status === 'capture' && $fraud === 'accept' => 'paid',
            $status === 'capture' && $fraud === 'challenge' => 'pending',
            $status === 'settlement' => 'paid',
            $status === 'pending' => 'pending',
            in_array($status, ['deny', 'cancel', 'expire', 'failure'], true) => 'cancelled',
            default => 'pending',
        };
    }
}
