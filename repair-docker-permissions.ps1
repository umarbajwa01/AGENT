$ErrorActionPreference = 'Stop'
$repairLog = Join-Path $PSScriptRoot 'docker-permission-repair.log'
try {
    foreach ($dockerDisk in @('D:\Docker\wsl\main\ext4.vhdx', 'D:\Docker\wsl\disk\docker_data.vhdx')) {
        & icacls.exe $dockerDisk /grant 'DESKTOP-I12O0HH\123:(F)' | Out-File -LiteralPath $repairLog -Append
        if ($LASTEXITCODE -ne 0) { throw "Permission repair failed for $dockerDisk" }
    }
    'SUCCESS' | Out-File -LiteralPath $repairLog -Append
} catch {
    $_ | Out-File -LiteralPath $repairLog -Append
    exit 1
}
