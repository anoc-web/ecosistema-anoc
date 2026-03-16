// script.js - Lógica para obtener datos de DEX Screener

async function fetchTokenData(baseAddress) {
    const url = `https://api.dexscreener.com/token-pairs/v1/polygon/${baseAddress}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching data for ${baseAddress}:`, error);
        return null;
    }
}

function findBestPair(pairs) {
    if (!pairs || pairs.length === 0) return null;
    
    // Primero intentamos buscar un par de Uniswap
    let bestPair = pairs.find(p => p.dexId === 'uniswap');
    
    // Si no hay Uniswap, buscamos el de mayor liquidez
    if (!bestPair) {
        bestPair = pairs.reduce((max, pair) => {
            const maxLiquidity = max?.liquidity?.usd || 0;
            const pairLiquidity = pair?.liquidity?.usd || 0;
            return pairLiquidity > maxLiquidity ? pair : max;
        }, null);
    }
    
    return bestPair;
}

async function loadAllTokens() {
    const tableBody = document.getElementById('tokenTableBody');
    
    // Limpiar tabla y mostrar cargando
    tableBody.innerHTML = '<tr><td colspan="6" class="loading">Cargando datos de DEX Screener...</td></tr>';
    
    let hasData = false;
    let htmlRows = '';
    
    for (const token of TOKENS) {
        const pairs = await fetchTokenData(token.baseAddress);
        const bestPair = findBestPair(pairs);
        
        if (bestPair) {
            hasData = true;
            
            const priceUsd = parseFloat(bestPair.priceUsd || 0);
            const priceChange = bestPair.priceChange?.h24 || 0;
            const volume24h = bestPair.volume?.h24 || 0;
            const liquidity = bestPair.liquidity?.usd || 0;
            
            const changeClass = priceChange >= 0 ? 'positive' : 'negative';
            const changeSymbol = priceChange >= 0 ? '+' : '';
            
            htmlRows += `
                <tr>
                    <td>
                        ${bestPair.info?.imageUrl ? `<img src="${bestPair.info.imageUrl}" class="token-logo" width="24" height="24">` : ''}
                        <strong>${token.symbol}</strong>
                    </td>
                    <td>$${priceUsd.toFixed(6)}</td>
                    <td class="${changeClass}">${changeSymbol}${priceChange.toFixed(2)}%</td>
                    <td>$${volume24h.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                    <td>$${liquidity.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                    <td>
                        <a href="${bestPair.url}" target="_blank" style="color: #7b8cde; text-decoration: none;">
                            ${bestPair.dexId}
                        </a>
                    </td>
                </tr>
            `;
        } else {
            htmlRows += `
                <tr>
                    <td><strong>${token.symbol}</strong></td>
                    <td colspan="5" style="color: #5a6270;">Sin datos disponibles</td>
                </tr>
            `;
        }
    }
    
    if (hasData) {
        tableBody.innerHTML = htmlRows;
    } else {
        tableBody.innerHTML = '<tr><td colspan="6" class="loading">No se pudieron cargar los datos. Intenta de nuevo más tarde.</td></tr>';
    }
}

// Iniciar cuando cargue la página
document.addEventListener('DOMContentLoaded', loadAllTokens);
