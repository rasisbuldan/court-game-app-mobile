# WSL Expo Port Forward Script
# Forwards Expo Metro bundler port (8081) from WSL to Windows host
# Run this script as Administrator in PowerShell

Write-Host "WSL Expo Port Forward Script" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Configuration
$expoPort = 8081
$expoPorts = @($expoPort, 19000, 19001, 19002)  # Expo uses multiple ports

Write-Host "Detecting WSL IP address..." -ForegroundColor Yellow

# Get WSL IP address
$wslIp = bash.exe -c "ip addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}'"

if ([string]::IsNullOrEmpty($wslIp)) {
    Write-Host "ERROR: Could not detect WSL IP address" -ForegroundColor Red
    Write-Host "Make sure WSL is running" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "WSL IP detected: $wslIp" -ForegroundColor Green
Write-Host ""

# Function to check if port forwarding exists
function Test-PortProxyExists {
    param($port)
    $existing = netsh interface portproxy show v4tov4 | Select-String -Pattern "0.0.0.0\s+$port"
    return $null -ne $existing
}

# Function to remove existing port forwarding
function Remove-PortProxy {
    param($port)
    Write-Host "Removing existing port forwarding for port $port..." -ForegroundColor Yellow
    netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0 | Out-Null
}

# Function to add port forwarding
function Add-PortProxy {
    param($port, $wslIp)
    Write-Host "Setting up port forwarding for port $port..." -ForegroundColor Yellow
    netsh interface portproxy add v4tov4 listenport=$port listenaddress=0.0.0.0 connectport=$port connectaddress=$wslIp | Out-Null
}

# Function to add firewall rule
function Add-FirewallRule {
    param($port)
    $ruleName = "WSL Expo Port $port"

    # Check if rule exists
    $existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue

    if ($existingRule) {
        Write-Host "Firewall rule for port $port already exists" -ForegroundColor Gray
    } else {
        Write-Host "Creating firewall rule for port $port..." -ForegroundColor Yellow
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $port | Out-Null
        Write-Host "Firewall rule created for port $port" -ForegroundColor Green
    }
}

Write-Host "Configuring port forwarding for Expo..." -ForegroundColor Cyan
Write-Host ""

# Set up port forwarding for all Expo ports
foreach ($port in $expoPorts) {
    Write-Host "--- Port $port ---" -ForegroundColor Cyan

    # Remove existing forwarding if it exists
    if (Test-PortProxyExists $port) {
        Remove-PortProxy $port
    }

    # Add new port forwarding
    Add-PortProxy $port $wslIp

    # Add firewall rule
    Add-FirewallRule $port

    Write-Host "Port $port forwarding configured successfully" -ForegroundColor Green
    Write-Host ""
}

Write-Host "=============================" -ForegroundColor Cyan
Write-Host "Port forwarding summary:" -ForegroundColor Cyan
Write-Host ""

# Display current port forwarding configuration
$portProxyConfig = netsh interface portproxy show v4tov4

if ($portProxyConfig -match "Listen") {
    netsh interface portproxy show v4tov4
} else {
    Write-Host "No port forwarding configured" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Expo Metro bundler is now accessible from:" -ForegroundColor Green
Write-Host "  - Windows host: http://localhost:8081" -ForegroundColor White
Write-Host "  - Local network: http://[your-windows-ip]:8081" -ForegroundColor White
Write-Host ""
Write-Host "Expo DevTools ports:" -ForegroundColor Green
Write-Host "  - Metro bundler: 8081" -ForegroundColor White
Write-Host "  - DevTools: 19002" -ForegroundColor White
Write-Host "  - Expo Go: 19000, 19001" -ForegroundColor White
Write-Host ""
Write-Host "To connect your iPhone to the Expo dev server:" -ForegroundColor Yellow
Write-Host "  1. Make sure your iPhone is on the same network as your Windows PC" -ForegroundColor White
Write-Host "  2. Find your Windows IP address: ipconfig" -ForegroundColor White
Write-Host "  3. In Expo Go app, connect to http://[your-windows-ip]:8081" -ForegroundColor White
Write-Host ""
Write-Host "To remove port forwarding, run:" -ForegroundColor Yellow
Write-Host "  netsh interface portproxy delete v4tov4 listenport=8081 listenaddress=0.0.0.0" -ForegroundColor White
Write-Host "  netsh interface portproxy delete v4tov4 listenport=19000 listenaddress=0.0.0.0" -ForegroundColor White
Write-Host "  netsh interface portproxy delete v4tov4 listenport=19001 listenaddress=0.0.0.0" -ForegroundColor White
Write-Host "  netsh interface portproxy delete v4tov4 listenport=19002 listenaddress=0.0.0.0" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter to exit..."
Read-Host
