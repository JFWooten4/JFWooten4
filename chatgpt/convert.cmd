@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
set "PYTHON_SCRIPT=%SCRIPT_DIR%docx-to-md.py"

if not exist "%PYTHON_SCRIPT%" (
  echo Missing script: "%PYTHON_SCRIPT%"
  exit /b 1
)

set /a COUNT=0
for %%F in ("%SCRIPT_DIR%*.docx") do (
  set /a COUNT+=1
  set "INPUT_FILE=%%~fF"
)

if %COUNT% EQU 0 (
  echo No .docx file found in "%SCRIPT_DIR%"
  exit /b 1
)

if %COUNT% GTR 1 (
  echo Expected exactly one .docx file in "%SCRIPT_DIR%", found %COUNT%.
  exit /b 1
)

set "LOG_FILE=%TEMP%\docx-to-md-%RANDOM%%RANDOM%.log"
set "LAST_LINE="

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  python "%PYTHON_SCRIPT%" "%INPUT_FILE%" > "%LOG_FILE%" 2>&1
) else (
  where py >nul 2>nul
  if %ERRORLEVEL% EQU 0 (
    py "%PYTHON_SCRIPT%" "%INPUT_FILE%" > "%LOG_FILE%" 2>&1
  ) else (
    echo Python was not found in PATH.
    exit /b 1
  )
)

set "CONVERT_EXIT=%ERRORLEVEL%"
type "%LOG_FILE%"
for /f "usebackq delims=" %%L in ("%LOG_FILE%") do set "LAST_LINE=%%L"
del /f /q "%LOG_FILE%" >nul 2>nul

if not "%CONVERT_EXIT%"=="0" (
  echo Conversion failed.
  exit /b 1
)

if not defined LAST_LINE (
  echo Conversion succeeded, but the output path could not be determined.
  exit /b 1
)

if /i not "!LAST_LINE:~0,6!"=="Wrote " (
  echo Conversion succeeded, but the output path could not be determined.
  exit /b 1
)

set "OUTPUT_FILE=!LAST_LINE:~6!"

del /f /q "%INPUT_FILE%"
if not %ERRORLEVEL% EQU 0 (
  echo Converted file was created, but deleting the original .docx failed.
  exit /b 1
)

echo Created: "%OUTPUT_FILE%"
echo Deleted original: "%INPUT_FILE%"
exit /b 0
