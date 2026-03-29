$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonScript = Join-Path $scriptDir "docx-to-md.py"

if (-not (Test-Path -LiteralPath $pythonScript)) {
    throw "Missing script: $pythonScript"
}

$docxFiles = Get-ChildItem -LiteralPath $scriptDir -Filter *.docx -File

if ($docxFiles.Count -eq 0) {
    throw "No .docx file found in $scriptDir"
}

if ($docxFiles.Count -gt 1) {
    $names = $docxFiles.Name -join ", "
    throw "Expected exactly one .docx file in $scriptDir, found: $names"
}

$inputFile = $docxFiles[0]
$outputFile = Join-Path $scriptDir ($inputFile.BaseName + ".md")

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    $python = Get-Command py -ErrorAction SilentlyContinue
}

if (-not $python) {
    throw "Python was not found in PATH."
}

if ($python.Name -eq "py.exe" -or $python.Name -eq "py") {
    & $python.Source $pythonScript $inputFile.FullName -o $outputFile
} else {
    & $python.Source $pythonScript $inputFile.FullName -o $outputFile
}

if ($LASTEXITCODE -ne 0) {
    throw "Conversion failed."
}

Remove-Item -LiteralPath $inputFile.FullName -Force

Write-Host ""
Write-Host "Created: $outputFile"
Write-Host "Deleted original: $($inputFile.FullName)"
