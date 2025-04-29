@echo off
echo Starting SokoClick with reduced timeouts...
set VITE_API_TIMEOUT=10000
set VITE_SUPABASE_REALTIME_TIMEOUT=10000
set VITE_UPLOAD_MAX_RETRIES=3
set VITE_UPLOAD_RETRY_DELAY=500
echo Environment variables set:
echo API Timeout: %VITE_API_TIMEOUT%ms
echo Supabase Realtime Timeout: %VITE_SUPABASE_REALTIME_TIMEOUT%ms
echo Upload Max Retries: %VITE_UPLOAD_MAX_RETRIES%
echo Upload Retry Delay: %VITE_UPLOAD_RETRY_DELAY%ms
echo Starting development server...
npm run dev 