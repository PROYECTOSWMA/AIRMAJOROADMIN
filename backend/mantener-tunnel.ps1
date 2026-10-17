# Script para mantener túnel SSH activo con reconexión automática
# Uso: .\mantener-tunnel.ps1

param(
    [string]$ServerUser = "server",
    [string]$ServerHost = "51.38.243.200",
    [int]$LocalPort = 5444,
    [int]$RemotePort = 5444,
    [int]$CheckInterval = 30
)

function Test-TunnelConnection {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", $LocalPort)
        $tcpClient.Close()
        return $true
    }
    catch {
        return $false
    }
}

function Start-SSHTunnel {
    Write-Host "Iniciando túnel SSH..." -ForegroundColor Green
    $sshCommand = "ssh -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -L ${LocalPort}:127.0.0.1:${RemotePort} ${ServerUser}@${ServerHost}"
    
    try {
        Start-Process -FilePath "ssh" -ArgumentList "-o ServerAliveInterval=30", "-o ServerAliveCountMax=3", "-o ExitOnForwardFailure=yes", "-L ${LocalPort}:127.0.0.1:${RemotePort}", "${ServerUser}@${ServerHost}" -PassThru
    }
    catch {
        Write-Host "Error al iniciar túnel: $_" -ForegroundColor Red
    }
}

Write-Host "=== Mantenedor de Túnel SSH ===" -ForegroundColor Cyan
Write-Host "Servidor: ${ServerUser}@${ServerHost}" -ForegroundColor White
Write-Host "Puerto: ${LocalPort} -> 127.0.0.1:${RemotePort}" -ForegroundColor White
Write-Host "Verificación cada: ${CheckInterval} segundos" -ForegroundColor White
Write-Host "Presione Ctrl+C para detener" -ForegroundColor Yellow

while ($true) {
    if (-not (Test-TunnelConnection)) {
        Write-Host "$(Get-Date -Format 'HH:mm:ss'): Túnel caído, reconectando..." -ForegroundColor Red
        Start-SSHTunnel
        Start-Sleep 5  # Esperar a que se establezca la conexión
    } else {
        Write-Host "$(Get-Date -Format 'HH:mm:ss'): Túnel activo" -ForegroundColor Green
    }
    
    Start-Sleep $CheckInterval
}
