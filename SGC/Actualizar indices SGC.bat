@echo off
title Actualizar indices SGC - Grupo Falpat
echo ============================================================
echo  Actualiza los indices (TOC) y numeracion de los .docx del SGC
echo  IMPORTANTE: cerra Microsoft Word antes de continuar.
echo ============================================================
echo.
pause
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0actualizar_indices.ps1"
echo.
echo Proceso terminado.
pause
