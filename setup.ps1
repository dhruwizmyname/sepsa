# EventSnap Ultimate Setup & Sync Script
Write-Host "--- Starting EventSnap System Check ---" -ForegroundColor Cyan

# 1. Stop & Clean Old Containers
Write-Host "CLEANING: Removing old Docker instances..." -ForegroundColor Yellow
docker-compose down --remove-orphans

# 2. Rebuild Everything
Write-Host "BUILDING: Rebuilding Frontend and Backend..." -ForegroundColor Yellow
docker-compose up -d --build

# 3. Sync Missing UI Packages
# Is line mein error tha, ab ye ekdam clean hai
Write-Host "SYNCING: Installing UI dependencies (Lucide, Radix, etc.)..." -ForegroundColor Yellow
docker exec -it sepsa-frontend-1 npm install lucide-react class-variance-authority @radix-ui/react-slot clsx tailwind-merge

# 4. Verify Git Status
Write-Host "GIT: Checking Repository Status..." -ForegroundColor Yellow
git status

Write-Host "SUCCESS: System is ONLINE!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan