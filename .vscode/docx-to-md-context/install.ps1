param(
  [string]$ExtensionsDir = "$env:USERPROFILE\\.vscode\\extensions",
  [string]$LinkName = "jfwooten4.docx-to-md-context-0.0.1"
)

$sourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$targetDir = Join-Path $ExtensionsDir $LinkName

if (-not (Test-Path -LiteralPath $ExtensionsDir)) {
  New-Item -ItemType Directory -Path $ExtensionsDir | Out-Null
}

if (Test-Path -LiteralPath $targetDir) {
  $item = Get-Item -LiteralPath $targetDir -Force
  if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
    Remove-Item -LiteralPath $targetDir -Force
  } else {
    throw "Target already exists and is not a junction or symlink: $targetDir"
  }
}

New-Item -ItemType Junction -Path $targetDir -Target $sourceDir | Out-Null
Write-Host "Installed extension link:"
Write-Host "  $targetDir -> $sourceDir"
Write-Host "Reload VS Code to pick up the extension."
