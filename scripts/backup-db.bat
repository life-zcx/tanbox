@echo off
REM ==============================================================================
REM TANBOX Database Automated Backup Script for Windows
REM ==============================================================================

setlocal enabledelayedexpansion
set "BACKUP_DIR=backups"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%
set "FILENAME=%BACKUP_DIR%\tanbox_db_backup_%TIMESTAMP%.sql"

echo [TANBOX] Starting PostgreSQL database backup...

docker exec -i tanbox_postgres pg_dump -U tanbox_user tanbox_db > "%FILENAME%"

if %ERRORLEVEL% EQU 0 (
    echo [TANBOX] Backup successfully created at: %FILENAME%
) else (
    echo [TANBOX] Error creating database backup!
)
