# Script to convert Google credentials JSON to base64 for Vercel

Write-Host "Converting Google Credentials to Base64..." -ForegroundColor Cyan
Write-Host ""

$credentialsPath = "server\credentials\onyx-smoke-481305-u0-b9ff23aa08df.json"

if (Test-Path $credentialsPath) {
    $json = Get-Content $credentialsPath -Raw
    $base64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json))
    
    Write-Host "Conversion successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Copy this base64 string and add it to Vercel environment variables:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Variable Name: GOOGLE_CREDENTIALS_BASE64" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Value:" -ForegroundColor Magenta
    Write-Host $base64
    Write-Host ""
    Write-Host "Base64 string copied to clipboard!" -ForegroundColor Green
    Set-Clipboard -Value $base64
    Write-Host ""
} else {
    Write-Host "Error: Credentials file not found at: $credentialsPath" -ForegroundColor Red
    Write-Host "Please make sure the Google credentials JSON file exists in the server/credentials folder." -ForegroundColor Yellow
}
