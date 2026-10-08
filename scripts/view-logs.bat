@echo off
REM ==============================================================================
REM TANBOX Server Logs Viewer CLI for Windows
REM ==============================================================================

set "SERVICE=%~1"
if "%SERVICE%"=="" set "SERVICE=backend"

set "LINES=%~2"
if "%LINES%"=="" set "LINES=100"

echo [TANBOX] Tailing %SERVICE% logs (last %LINES% lines)...

if "%SERVICE%"=="backend" docker compose logs --tail=%LINES% -f backend
if "%SERVICE%"=="caddy" docker compose logs --tail=%LINES% -f caddy
if "%SERVICE%"=="postgres" docker compose logs --tail=%LINES% -f postgres
if "%SERVICE%"=="label" docker compose logs --tail=%LINES% -f label-generator
if "%SERVICE%"=="all" docker compose logs --tail=%LINES% -f
