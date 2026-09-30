Add-Type -AssemblyName System.Device
$watcher = New-Object System.Device.Location.GeoCoordinateWatcher([System.Device.Location.GeoPositionAccuracy]::High)
$watcher.Start()

for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 500
    if ($watcher.Status -eq [System.Device.Location.GeoPositionStatus]::Ready -and -not $watcher.Position.Location.IsUnknown) {
        $loc = $watcher.Position.Location
        Write-Output "SUCCESS: Latitude=$($loc.Latitude), Longitude=$($loc.Longitude), Accuracy=$($loc.HorizontalAccuracy)"
        $watcher.Stop()
        exit 0
    }
}

Write-Output "FAILED: Status=$($watcher.Status), LocationUnknown=$($watcher.Position.Location.IsUnknown)"
$watcher.Stop()
