import sys
import random
import time

# const double reward[25]
reward = [0,0,0,0,0,0,20000,72,1440,720,160,504,216,144,108,360,144,360,238,72,612,2160,288,3600,7200]

result_toString = ["", "第一横行", "第二横行", "第三横行", "第一竖列", "第二竖列", "第三竖列", "左对角线（ \\ ）", "右对角线（ / ）"]

Parti = [0.0] * 9
grid = [[0]*4 for _ in range(4)]
isRevealed = [False] * 15
notRevealed = [0] * 15

def random_grid():
    # srand(time(NULL)) is handled by Python's random module automatically
    ran = [0] * 10
    ranx = [0] * 10
    for i in range(1, 5):
        pd = 0
        while True:
            pd = 0
            ran[i] = random.randint(1, 9)
            for j in range(1, i):
                if ran[i] == ran[j]:
                    pd = 1
                    break
            if pd == 0: break
        
        ranx[i] = random.randint(1, 9)
        while True:
            pd = 0
            ranx[i] = random.randint(1, 9)
            for j in range(1, i):
                if ranx[i] == ranx[j]:
                    pd = 1
                    break
            if pd == 0: break
        
        # grid[(ranx[i]-1)/3+1][ranx[i]-(ranx[i]-1)/3*3]=ran[i];
        row = (ranx[i] - 1) // 3 + 1
        col = ranx[i] - ((ranx[i] - 1) // 3) * 3
        grid[row][col] = ran[i]
        isRevealed[ran[i]] = True
    
    # commented out print loop in original
    # for i in range(1, 4):
    #     for j in range(1, 4):
    #         print(grid[i][j], end=" ")
    #     print()

def main():
    input_buffer = []

    def get_next_int():
        while not input_buffer:
            try:
                line = input()
                if not line: return None
                input_buffer.extend(line.split())
            except EOFError:
                return None
        return int(input_buffer.pop(0))

    while True:
        for i in range(9):
            Parti[i] = 0.0
        for i in range(15):
            isRevealed[i] = False
        for i in range(4):
            for j in range(4):
                grid[i][j] = 0
        
        # srand(time(NULL));
        sum_val = 0
        
        # commented out loop in original
        # for t in range(1, 88889): ...
        
        # random_grid()
        
        print("Please enter numbers for the grid:('0' for unknown squares,there are 5 zeros in total)")
        
        try:
            for i in range(1, 4):
                for j in range(1, 4):
                    val = get_next_int()
                    if val is None: return
                    grid[i][j] = val
                    isRevealed[grid[i][j]] = True
        except ValueError:
            return

        cnt = 0
        for i in range(1, 10):
            if not isRevealed[i]:
                cnt += 1
                notRevealed[cnt] = i
        
        # Calculate the "horizonal" Participation
        for i in range(1, 4):
            notRevealed_cnt = 0
            number = 0
            for j in range(1, 4):
                if grid[i][j] == 0:
                    notRevealed_cnt += 1
                number += grid[i][j]
            
            for j in range(1, cnt + 1):
                if notRevealed_cnt == 0:
                    Parti[i] += reward[number]
                    break
                
                for k in range(1, cnt + 1):
                    if notRevealed_cnt == 1:
                        Parti[i] += (0.2 * reward[notRevealed[j] + number])
                        break
                    
                    if k == j: continue
                    
                    for l in range(1, cnt + 1):
                        if notRevealed_cnt == 2:
                            Parti[i] += (0.2 * 0.25 * reward[notRevealed[j] + notRevealed[k] + number])
                            break
                        
                        if l == j or l == k: continue
                        Parti[i] += (0.2 * 0.25 * (1.0/3.0) * reward[notRevealed[j] + notRevealed[k] + notRevealed[l]])

        # Calculate the "verticle" Participation
        for i in range(1, 4):
            notRevealed_cnt = 0
            number = 0
            for j in range(1, 4):
                if grid[j][i] == 0:
                    notRevealed_cnt += 1
                number += grid[j][i]
            
            for j in range(1, cnt + 1):
                if notRevealed_cnt == 0:
                    Parti[i+3] += reward[number]
                    break
                
                for k in range(1, cnt + 1):
                    if notRevealed_cnt == 1:
                        Parti[i+3] += (0.2 * reward[notRevealed[j] + number])
                        break
                    
                    if k == j: continue
                    
                    for l in range(1, cnt + 1):
                        if notRevealed_cnt == 2:
                            Parti[i+3] += (0.2 * 0.25 * reward[notRevealed[j] + notRevealed[k] + number])
                            break
                        
                        if l == j or l == k: continue
                        Parti[i+3] += (0.2 * 0.25 * (1.0/3.0) * reward[notRevealed[j] + notRevealed[k] + notRevealed[l]])
        
        # Calculate the Diagonal(Left) Participation
        nR_cnt = 0
        num = 0
        for i in range(1, 4):
            if grid[i][i] == 0:
                nR_cnt += 1
            num += grid[i][i]
        
        for i in range(1, cnt + 1):
            if nR_cnt == 0:
                Parti[7] += reward[num]
                break
            
            for j in range(1, cnt + 1):
                if nR_cnt == 1:
                    Parti[7] += (0.2 * reward[notRevealed[i] + num])
                    break
                
                if j == i: continue
                
                for k in range(1, cnt + 1):
                    if nR_cnt == 2:
                        Parti[7] += (0.2 * 0.25 * reward[notRevealed[j] + notRevealed[i] + num])
                        break
                    
                    if k == j or k == i: continue
                    Parti[7] += (0.2 * 0.25 * (1.0/3.0) * reward[notRevealed[j] + notRevealed[k] + notRevealed[i]])

        # Calculate the Diagonal(Right) Participation
        nR_cnt = 0
        num = 0
        for i in range(1, 4):
            if grid[i][4-i] == 0:
                nR_cnt += 1
            num += grid[i][4-i]
        
        for i in range(1, cnt + 1):
            if nR_cnt == 0:
                Parti[8] += reward[num]
                break
            
            for j in range(1, cnt + 1):
                if nR_cnt == 1:
                    Parti[8] += (0.2 * reward[notRevealed[i] + num])
                    break
                
                if j == i: continue
                
                for k in range(1, cnt + 1):
                    if nR_cnt == 2:
                        Parti[8] += (0.2 * 0.25 * reward[notRevealed[j] + notRevealed[i] + num])
                        break
                    
                    if k == j or k == i: continue
                    Parti[8] += (0.2 * 0.25 * (1.0/3.0) * reward[notRevealed[j] + notRevealed[k] + notRevealed[i]])

        maxP = -1.0
        maxP_i = -1
        for i in range(1, 9):
            if Parti[i] > maxP:
                maxP = Parti[i]
                maxP_i = i
            print(f"{result_toString[i]}:{Parti[i]:.1f}")
        
        print()
        print(f"You need to choose: {result_toString[maxP_i]}")
        print(f"Participated Diamonds: {maxP:.1f}")
        sum_val += maxP
        print()

if __name__ == "__main__":
    main()
