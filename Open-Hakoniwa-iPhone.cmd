@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Open-Hakoniwa.ps1" -Lan
if errorlevel 1 pause
