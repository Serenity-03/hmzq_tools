#define SIZE 3
#include<cstdio>
#include<cstring>
#include<iostream>
#include<fstream>
#include<cstdlib>
#include<ctime>
using namespace std;
const double reward[25]={0,0,0,0,0,0,20000,72,1440,720,160,504,216,144,108,360,144,360,238,72,612,2160,288,3600,7200};//数字总和所对应的奖励
string result_toString[9]={"","第一横行","第二横行","第三横行","第一竖列","第二竖列","第三竖列","左对角线（ \\ ）","右对角线（ / ）"};
double Parti[9]={0};
int grid[4][4]={0};
bool isRevealed[15]={0};
int notRevealed[15];
void random_grid()
{
	//srand(time(NULL));
	int ran[10],ranx[10];
	for(int i=1;i<=4;i++)
	{
		int pd;
		while(1)
		{
			pd=0;
			ran[i]=rand()%9+1;
			for(int j=1;j<i;j++)
			{
				if(ran[i]==ran[j])
				{
					pd=1;
					break;
				}
			}
			if(pd==0) break;
		}
		ranx[i]=rand()%9+1;
		while(1)
		{
			pd=0;
			ranx[i]=rand()%9+1;
			for(int j=1;j<i;j++)
			{
				if(ranx[i]==ranx[j])
				{
					pd=1;
					break;
				}
			}
			if(pd==0) break;
		}
		grid[(ranx[i]-1)/3+1][ranx[i]-(ranx[i]-1)/3*3]=ran[i];
		isRevealed[ran[i]]=1;
	}
	/*for(int i=1;i<=3;i++)
	{
		for(int j=1;j<=3;j++)
			cout<<grid[i][j]<<" ";
		cout<<endl;
	}*/
}
int main()
{
	while(1){
	for(int i=0;i<9;i++)
	{
		Parti[i]=0;
	}
	for(int i=0;i<15;i++)
	{
		isRevealed[i]=0;
	}
	for(int i=0;i<4;i++)
	{
		for(int j=0;j<4;j++)
			grid[i][j]=0;
	}
	srand(time(NULL));
	int sum=0;
	//for(int t=1;t<=88888;t++)
	//{
	//	for(int i=1;i<=3;i++)
	//	{
	//		for(int j=1;j<=3;j++) grid[i][j]=0;
	//	}
	//	for(int i=1;i<=14;i++) isRevealed[i]=0;
	//	for(int i=1;i<=8;i++) Parti[i]=0;
	//random_grid();
	cout<<"Please enter numbers for the grid:('0' for unknown squares,there are 5 zeros in total)"<<endl;
	for(int i=1;i<=3;i++)
	{
		for(int j=1;j<=3;j++)
		{
			cin>>grid[i][j]; 
			isRevealed[grid[i][j]]=1;
		}
	}
	int cnt=0;
	for(int i=1;i<=9;i++)
	{
		if(!isRevealed[i]) 
			notRevealed[++cnt]=i;
	}
	//Calculate the "horizonal" Participation
	for(int i=1;i<=3;i++)
	{
		int notRevealed_cnt=0,number=0;
		for(int j=1;j<=3;j++)
		{
			if(grid[i][j]==0) 
				notRevealed_cnt++;
			number+=grid[i][j];
		}
		for(int j=1;j<=cnt;j++)
		{
			if(notRevealed_cnt==0)
			{
				Parti[i]+=(reward[number]);
				break;
			} 
			for(int k=1;k<=cnt;k++)
			{
				if(notRevealed_cnt==1)
				{
					Parti[i]+=(0.2*reward[notRevealed[j]+number]);
					break;
				}
				if(k==j) continue;
				for(int l=1;l<=cnt;l++)
				{
					if(notRevealed_cnt==2)
					{
						Parti[i]+=(0.2*0.25*reward[notRevealed[j]+notRevealed[k]+number]);
						break;
					}
					if(l==j||l==k) continue;
					Parti[i]+=(0.2*0.25*(1.0/3.0)*reward[notRevealed[j]+notRevealed[k]+notRevealed[l]]);
				}
			}
		}
	}
	//Calculate the "verticle" Participation
	for(int i=1;i<=3;i++)
	{
		int notRevealed_cnt=0,number=0;
		for(int j=1;j<=3;j++)
		{
			if(grid[j][i]==0) 
				notRevealed_cnt++;
			number+=grid[j][i];
		}
		for(int j=1;j<=cnt;j++)
		{
			if(notRevealed_cnt==0)
			{
				Parti[i+3]+=(reward[number]);
				break;
			} 
			for(int k=1;k<=cnt;k++)
			{
				if(notRevealed_cnt==1)
				{
					Parti[i+3]+=(0.2*reward[notRevealed[j]+number]);
					break;
				}
				if(k==j) continue;
				for(int l=1;l<=cnt;l++)
				{
					if(notRevealed_cnt==2)
					{
						Parti[i+3]+=(0.2*0.25*reward[notRevealed[j]+notRevealed[k]+number]);
						break;
					}
					if(l==j||l==k) continue;
					Parti[i+3]+=(0.2*0.25*(1.0/3.0)*reward[notRevealed[j]+notRevealed[k]+notRevealed[l]]);
				}
			}
		}
	}
	//Calculate the Diagonal(Left) Participation
	int nR_cnt=0,num=0;
	for(int i=1;i<=3;i++)
	{
		if(grid[i][i]==0) 
			nR_cnt++;
		num+=grid[i][i];
	}
	for(int i=1;i<=cnt;i++)
	{
		if(nR_cnt==0)
		{
			Parti[7]+=(reward[num]);
			break;
		} 
		for(int j=1;j<=cnt;j++)
		{
			if(nR_cnt==1)
			{
				Parti[7]+=(0.2*reward[notRevealed[i]+num]);
				break;
			}
			if(j==i) continue;
			for(int k=1;k<=cnt;k++)
			{
				if(nR_cnt==2)
				{
					Parti[7]+=(0.2*0.25*reward[notRevealed[j]+notRevealed[i]+num]);
					break;
				}
				if(k==j||k==i) continue;
				Parti[7]+=(0.2*0.25*(1.0/3.0)*reward[notRevealed[j]+notRevealed[k]+notRevealed[i]]);
			}
		}
	}
	//Calculate the Diagonal(Right) Participation
	nR_cnt=0;num=0;
	for(int i=1;i<=3;i++)
	{
		if(grid[i][4-i]==0) 
			nR_cnt++;
		num+=grid[i][4-i];
	}
	for(int i=1;i<=cnt;i++)
	{
		if(nR_cnt==0)
		{
			Parti[8]+=(reward[num]);
			break;
		} 
		for(int j=1;j<=cnt;j++)
		{
			if(nR_cnt==1)
			{
				Parti[8]+=(0.2*reward[notRevealed[i]+num]);
				break;
			}
			if(j==i) continue;
			for(int k=1;k<=cnt;k++)
			{
				if(nR_cnt==2)
				{
					Parti[8]+=(0.2*0.25*reward[notRevealed[j]+notRevealed[i]+num]);
					break;
				}
				if(k==j||k==i) continue;
				Parti[8]+=(0.2*0.25*(1.0/3.0)*reward[notRevealed[j]+notRevealed[k]+notRevealed[i]]);
			}
		}
	}
	int maxP=-1,maxP_i=-1;
	for(int i=1;i<=8;i++)
	{
		if(Parti[i]>maxP)
		{
			maxP=Parti[i];
			maxP_i=i;
		}
		cout<<result_toString[i]<<":"<<Parti[i]<<endl;
	}
	cout<<endl;
	cout<<"You need to choose: "<<result_toString[maxP_i]<<endl;
	cout<<"Participated Diamonds: "<<maxP<<endl;
	sum+=maxP;
	cout<<endl;
}
//cout<<sum/88888<<endl;
	return 0;
} 
