#!/bin/sh
# docker-entrypoint.hardhat.sh
# Levanta el nodo de Hardhat y despliega los contratos automáticamente

set -e

echo "╔═══════════════════════════════════════════════╗"
echo "║   🔗 AmazonIA — Hardhat Node + Auto-Deploy   ║"
echo "╚═══════════════════════════════════════════════╝"

# Iniciar Hardhat en background escuchando en 0.0.0.0 para ser accesible dentro de Docker
echo "[Hardhat] Starting local blockchain node..."
npx hardhat node --hostname 0.0.0.0 &
HARDHAT_PID=$!

# Esperar a que el nodo esté listo
echo "[Hardhat] Waiting for node to be ready..."
sleep 5

until npx hardhat --version > /dev/null 2>&1 && \
      nc -z localhost 8545 2>/dev/null; do
  echo "[Hardhat] Node not ready yet, retrying..."
  sleep 2
done

echo "[Hardhat] Node is ready! Deploying contracts..."

# Desplegar contratos
npx hardhat run scripts/deploy-all.ts --network localhost

echo "[Hardhat] Contracts deployed successfully!"
echo "[Hardhat] GovernanceRegistry -> 0x5FbDB2315678afecb367f032d93F642f64180aa3"
echo "[Hardhat] ArtisanNFTFactory   -> 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
echo "[Hardhat] 🟢 Blockchain node running at http://0.0.0.0:8545"

# Mantener el proceso de Hardhat en foreground
wait $HARDHAT_PID
