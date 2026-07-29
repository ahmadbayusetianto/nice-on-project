<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reset Password - Nice On</title>
</head>
<body style="margin:0; padding:0; background-color:#eef2fb; font-family:Arial, Helvetica, sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2fb; padding:32px 16px;">
<tr>
<td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 12px 40px rgba(10,40,90,0.12);">

<!-- Header -->
<tr>
<td style="background-color:#0a2a5e; background-image:linear-gradient(135deg,#071a3d,#1450d6); padding:32px 32px 40px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
<tr>
<td bgcolor="#ffffff" style="background-color:#ffffff; border-radius:10px; padding:10px 16px;">
<img src="{{ $message->embed(public_path('images/niceon-logo.png')) }}" alt="Nice On" width="120" style="display:block; border:0; outline:none; text-decoration:none;">
</td>
</tr>
</table>
<div style="color:#ffffff; font-size:22px; font-weight:700; line-height:1.3; margin-bottom:8px;">Permintaan Reset Password</div>
<div style="color:#bfd4fb; font-size:14px;">&#128274;&nbsp; Amankan kembali akses akunmu</div>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:32px;">
<p style="margin:0 0 8px 0; font-size:17px; font-weight:700; color:#0f172a;">Halo,</p>
<p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#4b5563;">Kami menerima permintaan untuk mereset password akun Nice On kamu.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" bgcolor="#1450d6" style="border-radius:10px;">
<a href="{{ $url }}" target="_blank" style="display:block; padding:16px 24px; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none;">Reset Password &rarr;</a>
</td>
</tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px; background-color:#f3f6fc; border-radius:10px;">
<tr>
<td style="padding:16px 18px;">
<p style="margin:0 0 4px 0; font-size:14px; font-weight:700; color:#1450d6;">&#9201;&nbsp; Tautan ini berlaku selama 60 menit.</p>
<p style="margin:0; font-size:13px; line-height:1.5; color:#5b6675;">Jika kamu tidak meminta reset password, abaikan email ini. Akunmu akan tetap aman.</p>
</td>
</tr>
</table>

<p style="margin:24px 0 0 0; font-size:14px; line-height:1.6; color:#4b5563;">Salam,<br><strong style="color:#0f172a;">Tim Nice On</strong></p>

<hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;">

<p style="margin:0 0 8px 0; font-size:12px; color:#6b7280;">Jika tombol tidak berfungsi, salin dan tempel tautan berikut ke browser:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f6fc; border-radius:8px;">
<tr>
<td style="padding:10px 14px; font-size:12px; color:#1450d6; word-break:break-all;">{{ $url }}</td>
</tr>
</table>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding:20px 32px; border-top:1px solid #eef1f6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="font-size:12px; color:#9aa3b2;">&copy; {{ date('Y') }} Nice On. Seluruh hak dilindungi.</td>
</tr>
</table>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>
