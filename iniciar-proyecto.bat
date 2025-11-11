@echo off
echo ========================================
echo    MARKETPLACE - INICIO DEL PROYECTO
echo ========================================
echo.
echo Este script abrira 2 ventanas:
echo   1. Backend (Puerto 3001)
echo   2. Mobile App (Expo)
echo.
echo Asegurate de tener:
echo  - PostgreSQL corriendo
echo  - Tu iPhone en la misma WiFi
echo  - Expo Go instalado en tu iPhone
echo.
pause

echo.
echo [1/2] Iniciando Backend...
start cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Iniciando Mobile App...
start cmd /k "cd mobile-new && npm start"

echo.
echo ========================================
echo   PROYECTO INICIADO
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Mobile: Escanea el QR con Expo Go
echo.
echo Para detener: Cierra ambas ventanas
echo ========================================
pause












