# PowerShell Script to Add Directories to User's PATH Environment Variable Permanently

# Function to add a directory to the PATH
Function Add-ToPath {
    param (
        [string]$directory
    )

    # Check if the directory already exists in PATH
    if (-not ($env:Path -split ';' | Where-Object { $_ -eq $directory })) {
        # Add the directory to user PATH
        [Environment]::SetEnvironmentVariable('Path', $env:Path + ';' + $directory, 'User')
        Write-Host "Added '$directory' to PATH" 
    } else {
        Write-Host "'$directory' is already in PATH"
    }
}

# Example directories to add
$directoriesToAdd = @(
    'C:\ExampleDir1',
    'C:\ExampleDir2'
)

# Add each directory in the list to PATH
foreach ($dir in $directoriesToAdd) {
    Add-ToPath -directory $dir
}

# Refreshing the PATH environment variable
# This ensures any new terminal session recognizes the updated PATH
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'User')
Write-Host "PATH refreshed for this session."