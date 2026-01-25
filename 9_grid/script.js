const reward = [0,0,0,0,0,0,20000,72,1440,720,160,504,216,144,108,360,144,360,238,72,612,2160,288,3600,7200];
const result_toString = ["", "第一横行", "第二横行", "第三横行", "第一竖列", "第二竖列", "第三竖列", "左对角线（ \\ ）", "右对角线（ / ）"];

// Initialize inputs
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.grid-cell');
    inputs.forEach(input => {
        input.addEventListener('input', calculate);
    });
    calculate();
});

function resetGrid() {
    const inputs = document.querySelectorAll('.grid-cell');
    inputs.forEach(input => input.value = '');
    calculate();
}

function calculate() {
    let grid = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]; // 1-based indexing for rows/cols to match logic easily
    let isRevealed = new Array(15).fill(false);
    let Parti = new Array(9).fill(0.0);

    // Read Input
    for(let i=1; i<=3; i++) {
        for(let j=1; j<=3; j++) {
            const val = parseInt(document.getElementById(`cell-${i}-${j}`).value) || 0;
            if(val >= 1 && val <= 9) {
                grid[i][j] = val;
                isRevealed[val] = true;
            } else {
                grid[i][j] = 0;
            }
        }
    }

    // Determine Remaining Numbers
    let notRevealed = [];
    for(let i=1; i<=9; i++) {
        if(!isRevealed[i]) {
            notRevealed.push(i);
        }
    }
    
    // Update UI for remaining numbers
    const remContainer = document.getElementById('remaining-numbers');
    remContainer.innerHTML = notRevealed.map(n => `<span class="rem-num">${n}</span>`).join('');

    const cnt = notRevealed.length;

    // Helper function to calculate expectation for a line
    function calculateLineExpectation(cells) {
        let unknowns = 0;
        let sum = 0;
        cells.forEach(val => {
            if(val === 0) unknowns++;
            else sum += val;
        });

        if(unknowns === 0) return reward[sum];

        let totalExpectation = 0;

        // Simulate all combinations for unknowns
        // If unknowns > 0, we pick 'unknowns' numbers from 'notRevealed'
        // Since the logic in original code was specific for 1, 2, 3 unknowns with specific probabilities (1/cnt, etc.)
        // We will implement a general permutation approach or specific cases as per original code structure
        
        // General logic:
        // Expected Value = Sum(Prob(Combination) * Reward(Sum + CombinationSum))
        
        // Case 1: 1 Unknown
        if(unknowns === 1) {
            for(let j=0; j<cnt; j++) {
                // Prob of picking notRevealed[j] is 1/cnt
                totalExpectation += (1.0/cnt) * reward[sum + notRevealed[j]];
            }
        }
        // Case 2: 2 Unknowns
        else if(unknowns === 2) {
            if(cnt < 2) return 0; // Should not happen if inputs are valid
            for(let j=0; j<cnt; j++) {
                for(let k=0; k<cnt; k++) {
                    if(j === k) continue;
                    // Prob of picking j then k: (1/cnt) * (1/(cnt-1))
                    // Wait, order doesn't matter for sum, but matters for probability calculation flow
                    // Permutations of size 2 from cnt: cnt * (cnt-1)
                    // Prob of each pair {a, b} is 1 / (cnt * (cnt-1)/2) ? No.
                    // Let's stick to the loop logic:
                    // P(first=j) = 1/cnt
                    // P(second=k | first=j) = 1/(cnt-1)
                    // Joint P = 1 / (cnt * (cnt-1))
                    totalExpectation += (1.0 / (cnt * (cnt-1))) * reward[sum + notRevealed[j] + notRevealed[k]];
                }
            }
        }
        // Case 3: 3 Unknowns
        else if(unknowns === 3) {
            if(cnt < 3) return 0;
            for(let j=0; j<cnt; j++) {
                for(let k=0; k<cnt; k++) {
                    if(j === k) continue;
                    for(let l=0; l<cnt; l++) {
                        if(l === j || l === k) continue;
                         // P = 1 / (cnt * (cnt-1) * (cnt-2))
                        totalExpectation += (1.0 / (cnt * (cnt-1) * (cnt-2))) * reward[sum + notRevealed[j] + notRevealed[k] + notRevealed[l]];
                    }
                }
            }
        }

        return totalExpectation;
    }

    // Rows
    for(let i=1; i<=3; i++) {
        let line = [grid[i][1], grid[i][2], grid[i][3]];
        Parti[i] = calculateLineExpectation(line);
        document.getElementById(`res-row-${i}`).innerText = Parti[i].toFixed(1);
    }

    // Cols
    for(let i=1; i<=3; i++) {
        let line = [grid[1][i], grid[2][i], grid[3][i]];
        Parti[i+3] = calculateLineExpectation(line);
        document.getElementById(`res-col-${i}`).innerText = Parti[i+3].toFixed(1);
    }

    // Diagonals
    let diag1 = [grid[1][1], grid[2][2], grid[3][3]];
    Parti[7] = calculateLineExpectation(diag1);
    document.getElementById(`val-diag-1`).innerText = Parti[7].toFixed(1);

    let diag2 = [grid[1][3], grid[2][2], grid[3][1]];
    Parti[8] = calculateLineExpectation(diag2);
    document.getElementById(`val-diag-2`).innerText = Parti[8].toFixed(1);

    // Find Best
    let maxP = -1;
    let maxIndex = -1;
    for(let i=1; i<=8; i++) {
        // Reset styles
        if(i <= 3) document.getElementById(`res-row-${i}`).classList.remove('best-choice');
        else if(i <= 6) document.getElementById(`res-col-${i-3}`).classList.remove('best-choice');
        else document.getElementById(`res-diag-${i-6}`).classList.remove('best-choice');

        if(Parti[i] > maxP) {
            maxP = Parti[i];
            maxIndex = i;
        }
    }

    if(maxIndex !== -1) {
        document.getElementById('recommendation').innerText = `${result_toString[maxIndex]} (期望: ${maxP.toFixed(1)})`;
        
        // Highlight best
        if(maxIndex <= 3) document.getElementById(`res-row-${maxIndex}`).classList.add('best-choice');
        else if(maxIndex <= 6) document.getElementById(`res-col-${maxIndex-3}`).classList.add('best-choice');
        else document.getElementById(`res-diag-${maxIndex-6}`).classList.add('best-choice');
    }
}
