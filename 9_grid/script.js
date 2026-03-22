const reward = [0,0,0,0,0,0,20000,72,1440,720,160,504,216,144,108,360,144,360,238,72,612,2160,288,3600,7200];
const result_toString = ["", "第一横行", "第二横行", "第三横行", "第一竖列", "第二竖列", "第三竖列", "左对角线（ \\ ）", "右对角线（ / ）"];

// Initialize inputs
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.grid-cell');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
             // Debounce slightly to allow UI to update if we add heavy calc
             setTimeout(updateGameState, 10);
        });
    });
    updateGameState();

    // Global Esc key listener for quick reset
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            resetGrid();
            // Remove focus from any active input to clearly indicate reset
            if (document.activeElement && document.activeElement.blur) {
                document.activeElement.blur();
            }
        }
    });
});

function resetGrid() {
    const inputs = document.querySelectorAll('.grid-cell');
    inputs.forEach(input => input.value = '');
    updateGameState();
}

function updateGameState() {
    const { grid, isRevealed, notRevealed, count } = readGrid();
    
    // Update UI for remaining numbers
    const remContainer = document.getElementById('remaining-numbers');
    remContainer.innerHTML = notRevealed.map(n => `<span class="rem-num">${n}</span>`).join('');

    // Clear previous recommendations and EV displays
    document.querySelectorAll('.grid-cell').forEach(el => el.classList.remove('recommend-scratch'));
    document.querySelectorAll('.row-result, .col-result, .diag-result').forEach(el => el.classList.remove('best-choice'));
    document.querySelectorAll('.ev-display').forEach(el => el.innerText = '');
    document.getElementById('recommendation').innerText = '';
    document.getElementById('probability-breakdown').innerHTML = '';
    document.getElementById('alternate-recommendation-container').style.display = 'none';
    document.getElementById('alternate-recommendation').innerText = '';
    document.getElementById('alternate-probability-breakdown').innerHTML = '';

    // Calculate line expectations (always shown)
    const lineExpectations = calculateAllLinesExpectation(grid, isRevealed, notRevealed);
    displayLineExpectations(lineExpectations);

    // Decision Logic
    const statusEl = document.getElementById('step-status');

    if (count === 0) {
        statusEl.innerText = "第一阶段：请录入系统自动刮开的第 1 个格子";
        statusEl.style.color = '#333';
    } else if (count < 4) {
        const movesLeft = 4 - count;
        statusEl.innerText = `第二阶段：系统推荐最优方案，请继续刮开 ${movesLeft} 个格子`;
        statusEl.style.color = '#d35400';
        
        setTimeout(() => {
            const { bestMove, allEVs } = getBestNextMove(grid, isRevealed, notRevealed, movesLeft);
            
            // Display EVs for all unknown cells
            allEVs.forEach(evItem => {
                const evEl = document.getElementById(`ev-${evItem.r}-${evItem.c}`);
                if (evEl) {
                    if (evItem.ev === -9999) {
                        evEl.innerText = "避险";
                        evEl.style.color = "red";
                    } else {
                        evEl.innerText = evItem.ev.toFixed(0);
                        evEl.style.color = "";
                    }
                }
            });

            if (bestMove) {
                const cellId = `cell-${bestMove.r}-${bestMove.c}`;
                const cellElement = document.getElementById(cellId);
                cellElement.classList.add('recommend-scratch');
                document.getElementById('recommendation').innerText = `建议刮开：${bestMove.r}行${bestMove.c}列 (预估价值: ${bestMove.ev.toFixed(1)})`;
                
                // Auto-focus logic
                const autoFocus = document.getElementById('auto-focus-toggle').checked;
                if (autoFocus && cellElement) {
                    // Slight delay to ensure UI updates and focus feels natural
                    setTimeout(() => {
                        cellElement.focus();
                        cellElement.select(); // Also select content if any (though usually empty)
                    }, 50);
                }
            }
        }, 10);

    } else {
        statusEl.innerText = `第三阶段：次数用尽，请选择期望值最高的线路`;
        statusEl.style.color = '#27ae60';

        // Find best and second best lines
        let sortedLines = [];
        for(let i=1; i<=8; i++) {
            sortedLines.push({ index: i, ev: lineExpectations[i] });
        }
        sortedLines.sort((a, b) => b.ev - a.ev);

        const bestLine = sortedLines[0];
        const secondBestLine = sortedLines[1];

        if(bestLine) {
            document.getElementById('recommendation').innerText = `建议选择：${result_toString[bestLine.index]} (期望: ${bestLine.ev.toFixed(1)})`;
            highlightLine(bestLine.index, 'best-choice');
            displayProbabilityBreakdown(bestLine.index, grid, notRevealed, 'probability-breakdown');
        }

        // Show alternate if it's close enough
        if (secondBestLine && bestLine && (bestLine.ev - secondBestLine.ev < 300)) {
            const altContainer = document.getElementById('alternate-recommendation-container');
            altContainer.style.display = 'block';
            document.getElementById('alternate-recommendation').innerText = `备选方案：${result_toString[secondBestLine.index]} (期望: ${secondBestLine.ev.toFixed(1)})`;
            displayProbabilityBreakdown(secondBestLine.index, grid, notRevealed, 'alternate-probability-breakdown');
        }
    }
}

function highlightLine(lineIndex, className) {
    if(lineIndex <= 3) document.getElementById(`res-row-${lineIndex}`).classList.add(className);
    else if(lineIndex <= 6) document.getElementById(`res-col-${lineIndex-3}`).classList.add(className);
    else document.getElementById(`res-diag-${lineIndex-6}`).classList.add(className);
}

function displayProbabilityBreakdown(lineIndex, grid, notRevealed, elementId) {
    let cells = [];
    if (lineIndex <= 3) { // Row
        cells = [grid[lineIndex][1], grid[lineIndex][2], grid[lineIndex][3]];
    } else if (lineIndex <= 6) { // Col
        let col = lineIndex - 3;
        cells = [grid[1][col], grid[2][col], grid[3][col]];
    } else if (lineIndex === 7) { // Diag 1
        cells = [grid[1][1], grid[2][2], grid[3][3]];
    } else { // Diag 2
        cells = [grid[1][3], grid[2][2], grid[3][1]];
    }

    const probs = calculateLineProbabilities(cells, notRevealed);
    
    // Sort by probability desc
    const sortedRewards = Object.keys(probs).sort((a, b) => probs[b] - probs[a]);
    
    let html = '<div style="margin-top:5px; font-weight:bold; color:#333;">可能结果分布：</div>';
    sortedRewards.forEach(r => {
        const p = probs[r];
        if (p > 0.001) { // Hide very small probabilities
            html += `
                <div class="prob-item">
                    <span class="prob-reward">💎 ${r}</span>
                    <span class="prob-val">${(p * 100).toFixed(1)}%</span>
                </div>
            `;
        }
    });
    
    // Use the elementId parameter instead of hardcoding 'probability-breakdown'
    const targetElement = document.getElementById(elementId) || document.getElementById('probability-breakdown');
    if (targetElement) {
        targetElement.innerHTML = html;
    }
}

function calculateLineProbabilities(cells, notRevealed) {
    let unknowns = 0;
    let sum = 0;
    cells.forEach(val => {
        if(val === 0) unknowns++;
        else sum += val;
    });

    let probMap = {};

    if(unknowns === 0) {
        let r = reward[sum];
        probMap[r] = 1.0;
        return probMap;
    }

    const cnt = notRevealed.length;

    if(unknowns === 1) {
        for(let j=0; j<cnt; j++) {
            let r = reward[sum + notRevealed[j]];
            probMap[r] = (probMap[r] || 0) + (1.0/cnt);
        }
    }
    else if(unknowns === 2) {
        if(cnt < 2) return {};
        // 2 unknowns: Permutations of 2 from cnt
        // Total permutations = cnt * (cnt-1)
        // Each has prob 1 / (cnt * (cnt-1))
        const p = 1.0 / (cnt * (cnt-1));
        for(let j=0; j<cnt; j++) {
            for(let k=0; k<cnt; k++) {
                if(j === k) continue;
                let r = reward[sum + notRevealed[j] + notRevealed[k]];
                probMap[r] = (probMap[r] || 0) + p;
            }
        }
    }
    else if(unknowns === 3) {
        if(cnt < 3) return {};
        const p = 1.0 / (cnt * (cnt-1) * (cnt-2));
        for(let j=0; j<cnt; j++) {
            for(let k=0; k<cnt; k++) {
                if(j === k) continue;
                for(let l=0; l<cnt; l++) {
                    if(l === j || l === k) continue;
                    let r = reward[sum + notRevealed[j] + notRevealed[k] + notRevealed[l]];
                    probMap[r] = (probMap[r] || 0) + p;
                }
            }
        }
    }
    return probMap;
}

function readGrid() {
    let grid = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    let isRevealed = new Array(15).fill(false);
    let count = 0;

    for(let i=1; i<=3; i++) {
        for(let j=1; j<=3; j++) {
            const val = parseInt(document.getElementById(`cell-${i}-${j}`).value) || 0;
            if(val >= 1 && val <= 9) {
                grid[i][j] = val;
                if (!isRevealed[val]) { // Avoid double counting if user enters dupes (invalid state but handle safely)
                    isRevealed[val] = true;
                    count++;
                }
            } else {
                grid[i][j] = 0;
            }
        }
    }

    let notRevealed = [];
    for(let i=1; i<=9; i++) {
        if(!isRevealed[i]) {
            notRevealed.push(i);
        }
    }

    return { grid, isRevealed, notRevealed, count };
}

// ---- Core Calculation Logic ----

function calculateAllLinesExpectation(grid, isRevealed, notRevealed) {
    let Parti = new Array(9).fill(0.0);
    
    // Rows
    for(let i=1; i<=3; i++) {
        let line = [grid[i][1], grid[i][2], grid[i][3]];
        Parti[i] = calculateLineExpectation(line, notRevealed);
    }
    // Cols
    for(let i=1; i<=3; i++) {
        let line = [grid[1][i], grid[2][i], grid[3][i]];
        Parti[i+3] = calculateLineExpectation(line, notRevealed);
    }
    // Diags
    let diag1 = [grid[1][1], grid[2][2], grid[3][3]];
    Parti[7] = calculateLineExpectation(diag1, notRevealed);
    
    let diag2 = [grid[1][3], grid[2][2], grid[3][1]];
    Parti[8] = calculateLineExpectation(diag2, notRevealed);

    return Parti;
}

function displayLineExpectations(Parti) {
    for(let i=1; i<=3; i++) document.getElementById(`res-row-${i}`).innerText = Parti[i].toFixed(1);
    for(let i=1; i<=3; i++) document.getElementById(`res-col-${i}`).innerText = Parti[i+3].toFixed(1);
    document.getElementById(`val-diag-1`).innerText = Parti[7].toFixed(1);
    document.getElementById(`val-diag-2`).innerText = Parti[8].toFixed(1);
}

function calculateLineExpectation(cells, notRevealed) {
    let unknowns = 0;
    let sum = 0;
    cells.forEach(val => {
        if(val === 0) unknowns++;
        else sum += val;
    });

    if(unknowns === 0) return reward[sum];

    let totalExpectation = 0;
    const cnt = notRevealed.length;

    if(unknowns === 1) {
        for(let j=0; j<cnt; j++) {
            totalExpectation += (1.0/cnt) * reward[sum + notRevealed[j]];
        }
    }
    else if(unknowns === 2) {
        if(cnt < 2) return 0;
        // Permutations of 2 from cnt: P(cnt, 2) = cnt * (cnt-1)
        // Each pair (a,b) has prob 1/(cnt*(cnt-1))
        // But since a+b = b+a, we can iterate combinations and multiply by 2?
        // Or just iterate ordered pairs.
        for(let j=0; j<cnt; j++) {
            for(let k=0; k<cnt; k++) {
                if(j === k) continue;
                totalExpectation += (1.0 / (cnt * (cnt-1))) * reward[sum + notRevealed[j] + notRevealed[k]];
            }
        }
    }
    else if(unknowns === 3) {
        if(cnt < 3) return 0;
        for(let j=0; j<cnt; j++) {
            for(let k=0; k<cnt; k++) {
                if(j === k) continue;
                for(let l=0; l<cnt; l++) {
                    if(l === j || l === k) continue;
                    totalExpectation += (1.0 / (cnt * (cnt-1) * (cnt-2))) * reward[sum + notRevealed[j] + notRevealed[k] + notRevealed[l]];
                }
            }
        }
    }
    return totalExpectation;
}

// ---- Expectimax Search ----

// Returns { bestMove: { r, c, ev }, allEVs: [{r,c,ev}] }
function getBestNextMove(grid, isRevealed, notRevealed, movesLeft) {
    let bestEV = -1;
    let bestMove = null;
    let allEVs = [];

    // Identify all unknown cells
    let unknownCells = [];
    for(let i=1; i<=3; i++) {
        for(let j=1; j<=3; j++) {
            if(grid[i][j] === 0) {
                unknownCells.push({r: i, c: j});
            }
        }
    }

    // Available numbers
    const N = notRevealed.length;
    const prob = 1.0 / N;

    // For each unknown cell, calculate EV of scratching it
    for (let cell of unknownCells) {
        // Anti-Cheat Strategy: Check if this cell completes a potential 1-2-3 line
        // Only necessary if 1, 2, 3 are NOT all revealed yet.
        // If 1, 2, 3 are already visible (even scattered), there is no hidden 1-2-3 line to protect.
        const targets = [1, 2, 3];
        const allTargetsRevealed = targets.every(t => isRevealed[t]);
        
        if (!allTargetsRevealed && isRiskyCell(grid, cell.r, cell.c)) {
            allEVs.push({r: cell.r, c: cell.c, ev: -9999, note: "Risky"});
            continue; // Skip this cell for recommendation
        }

        let currentCellEV = 0;

        for (let k = 0; k < N; k++) {
            const val = notRevealed[k];
            
            // Apply move
            grid[cell.r][cell.c] = val;
            isRevealed[val] = true;
            const nextNotRevealed = notRevealed.filter((_, idx) => idx !== k);

            const res = solve(grid, isRevealed, nextNotRevealed, movesLeft - 1);
            currentCellEV += prob * res.ev;

            // Backtrack
            grid[cell.r][cell.c] = 0;
            isRevealed[val] = false;
        }

        allEVs.push({r: cell.r, c: cell.c, ev: currentCellEV});

        if (currentCellEV > bestEV) {
            bestEV = currentCellEV;
            bestMove = {r: cell.r, c: cell.c, ev: currentCellEV};
        }
    }

    return { bestMove, allEVs };
}

// Check if revealing (r, c) might expose the 3rd number of a {1, 2, 3} line
function isRiskyCell(grid, r, c) {
    const targets = [1, 2, 3];
    
    // Helper to check if a set of values contains exactly 2 distinct numbers from targets
    function checkLine(vals) {
        let found = 0;
        let hasOther = false;
        vals.forEach(v => {
            if (v !== 0) {
                if (targets.includes(v)) found++;
                else hasOther = true;
            }
        });
        // Risk condition: The line has 2 numbers from {1,2,3} AND no other numbers (the 3rd is the current empty cell)
        return found === 2 && !hasOther;
    }

    // Check Row
    if (checkLine([grid[r][1], grid[r][2], grid[r][3]])) return true;

    // Check Col
    if (checkLine([grid[1][c], grid[2][c], grid[3][c]])) return true;

    // Check Diagonals
    if (r === c) {
        if (checkLine([grid[1][1], grid[2][2], grid[3][3]])) return true;
    }
    if (r + c === 4) {
        if (checkLine([grid[1][3], grid[2][2], grid[3][1]])) return true;
    }

    return false;
}

function solve(grid, isRevealed, notRevealed, movesRemaining) {
    // Base Case: No moves left, we must choose a line.
    if (movesRemaining === 0) {
        const lines = calculateAllLinesExpectation(grid, isRevealed, notRevealed);
        let maxVal = 0;
        for(let i=1; i<=8; i++) if(lines[i] > maxVal) maxVal = lines[i];
        return { ev: maxVal };
    }

    // Recursive Step: Choose a cell to scratch
    let maxEV = -1;
    let bestCell = null;
    
    // Available cells
    let cells = [];
    for(let i=1; i<=3; i++) for(let j=1; j<=3; j++) if(grid[i][j] === 0) cells.push({r:i, c:j});

    // Available numbers
    const N = notRevealed.length;
    const prob = 1.0 / N;

    // For each candidate cell
    for (let cell of cells) {
        let currentCellEV = 0;

        // Sum over all possible outcomes (numbers)
        for (let k = 0; k < N; k++) {
            const val = notRevealed[k];
            
            // Apply move
            grid[cell.r][cell.c] = val;
            isRevealed[val] = true;
            // Create new notRevealed list (filter out val)
            // Optimization: Swap remove? or just filter. Filter is O(N).
            const nextNotRevealed = notRevealed.filter((_, idx) => idx !== k);

            // Recurse
            // Optimization: If movesRemaining is high (e.g. 3), this is slow.
            // If movesRemaining == 3: 8 cells * 8 numbers * solve(2)
            // solve(2): 7 cells * 7 numbers * solve(1)
            // solve(1): 6 cells * 6 numbers * solve(0)
            // Total leaf nodes: 64 * 49 * 36 = 112,896.
            // Each leaf node does calculateAllLinesExpectation (constant time ~8 lines).
            // 100k is acceptable for < 200ms delay.
            
            const res = solve(grid, isRevealed, nextNotRevealed, movesRemaining - 1);
            currentCellEV += prob * res.ev;

            // Backtrack
            grid[cell.r][cell.c] = 0;
            isRevealed[val] = false;
        }

        if (currentCellEV > maxEV) {
            maxEV = currentCellEV;
            bestCell = cell;
        }
    }

    return { r: bestCell?.r, c: bestCell?.c, ev: maxEV };
}
