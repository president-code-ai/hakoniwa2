param([switch]$NoBrowser, [switch]$Lan)
$ErrorActionPreference = 'Stop'
$projectPath = $PSScriptRoot
$listenHost = '127.0.0.1'
$logPrefix = 'local-server'
if ($Lan) {
    $addresses = @(
        foreach ($adapter in [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces()) {
            if ($adapter.OperationalStatus -ne 'Up') { continue }
            $properties = $adapter.GetIPProperties()
            $gateway = @($properties.GatewayAddresses | Where-Object { $_.Address.AddressFamily -eq 'InterNetwork' -and $_.Address.ToString() -ne '0.0.0.0' })
            if ($gateway.Count -eq 0) { continue }
            foreach ($address in $properties.UnicastAddresses) {
                $value = $address.Address.ToString()
                if ($address.Address.AddressFamily -eq 'InterNetwork' -and $value -match '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)') { $value }
            }
        }
    )
    if ($addresses.Count -ne 1) { throw 'Could not select a single home-network IPv4 address. Check the Ethernet/Wi-Fi connection.' }
    $listenHost = $addresses[0]
    $logPrefix = 'lan-server'
}
$siteUrl = 'http://' + $listenHost + ':5173/'
function Test-HakoniwaServer {
    try {
        $response = Invoke-WebRequest -Uri $siteUrl -UseBasicParsing -TimeoutSec 1
        if ($response.StatusCode -eq 200 -and $response.Content.Contains('HAKONIWA COLLECTION')) { return $true }
        throw 'Port 5173 is serving another application.'
    } catch [System.Net.WebException] { return $false }
}
if (-not (Test-HakoniwaServer)) {
    $entryPath = Join-Path $projectPath 'node_modules\vite\bin\vite.js'
    $builtPath = Join-Path $projectPath 'dist\index.html'
    if (-not (Test-Path -LiteralPath $entryPath) -or -not (Test-Path -LiteralPath $builtPath)) {
        throw 'Run npm install and npm run build in the hakoniwa2 folder first.'
    }
    $nodePath = (Get-Command node.exe -ErrorAction Stop).Source
    $logPath = Join-Path $projectPath 'artifacts'
    New-Item -ItemType Directory -Path $logPath -Force | Out-Null
    $serverArguments = @(('"' + $entryPath + '"'), 'preview', '--configLoader', 'native', '--host', $listenHost, '--port', '5173', '--strictPort')
    $serverProcess = Start-Process -FilePath $nodePath -ArgumentList $serverArguments -WorkingDirectory $projectPath -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logPath ($logPrefix + '.out.log')) -RedirectStandardError (Join-Path $logPath ($logPrefix + '.err.log')) -PassThru
    $deadline = (Get-Date).AddSeconds(15)
    $ready = $false
    while ((Get-Date) -lt $deadline) {
        if (Test-HakoniwaServer) { $ready = $true; break }
        $serverProcess.Refresh()
        if ($serverProcess.HasExited) { throw ('Server stopped. See artifacts\*-server.err.log. Exit code: ' + $serverProcess.ExitCode) }
        Start-Sleep -Milliseconds 250
    }
    if (-not $ready) { throw 'Server startup timed out. See artifacts\*-server.err.log.' }
}
Write-Output ('Hakoniwa is ready: ' + $siteUrl)
if (-not $NoBrowser) { Start-Process $siteUrl }
