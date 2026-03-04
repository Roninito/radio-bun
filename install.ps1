function Set-PersistentPath {
    param ([string]$pathToAdd)
    # Get the current PATH
    $currentPath = [System.Environment]::GetEnvironmentVariable('PATH', [System.EnvironmentVariableTarget]::Machine)
    
    # Check if the path already exists in the PATH
    if ($currentPath -notlike "*$pathToAdd*") {
        # Append the new path
        $newPath = $currentPath + ";$pathToAdd"
        [System.Environment]::SetEnvironmentVariable('PATH', $newPath, [System.EnvironmentVariableTarget]::Machine)
        Write-Host "Path added successfully."
    } else {
        Write-Host "The specified path already exists in the PATH variable."
    }
}

# Call the function to set persistent PATH for radio command
Set-PersistentPath 'C:\Program Files\radio\bin'