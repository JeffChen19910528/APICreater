# API Generator — PowerShell 靜默啟動器
$dir = Split-Path -Parent $PSCommandPath
Set-Location $dir
node "$dir\launcher.js" 2>&1 | Out-File "$dir\launcher.log"
if ($LASTEXITCODE -ne 0) {
    $log = if (Test-Path "$dir\launcher.log") { Get-Content "$dir\launcher.log" -Raw } else { "" }
    [System.Windows.Forms.MessageBox]::Show("啟動失敗 (code $LASTEXITCODE)`n$log", "API Generator Error")
}
