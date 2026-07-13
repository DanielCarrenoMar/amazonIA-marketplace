@echo off
echo ==========================================================
echo Starting AmazonIA Blockchain Development Environment...
echo ==========================================================

:: 1. Start Hardhat local node in a new window
echo [1/4] Starting Hardhat Local Node...
start "1. Hardhat Node (Blockchain)" cmd /k "pnpm --filter blockchain-notary hardhat node"

:: Wait for Hardhat to fully boot up before deploying
echo Waiting 4 seconds for the blockchain node to initialize...
timeout /t 4 >nul

:: 2. Deploy Governance Contract
echo [2/4] Deploying Governance Smart Contract...
call pnpm --filter blockchain-notary hardhat run scripts/deploy-governance.ts --network localhost

:: 3. Start Blockchain Notary microservice in a new window
echo [3/4] Starting Blockchain Notary (Port 3002)...
start "2. Blockchain Notary (Port 3002)" cmd /k "pnpm --filter blockchain-notary dev"

:: 4. Start NestJS API in a new window
echo [4/4] Starting NestJS API (Port 3001)...
start "3. NestJS API (Port 3001)" cmd /k "pnpm --filter api dev"

:: 5. Start Next.js Frontend in a new window
echo [5/5] Starting Next.js Frontend (Port 3000)...
start "4. Next.js Frontend (Port 3000)" cmd /k "pnpm --filter web dev"

echo ==========================================================
echo All services initiated in separate windows. Enjoy!
echo ==========================================================
