import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Building2, Calendar, DollarSign } from "lucide-react";

interface StockInfo {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  sector: string;
  volume: string;
  lastUpdated: string;
}

interface StockInfoCardProps {
  stockInfo?: StockInfo | null;
  isLoading?: boolean;
}

const StockInfoCard = ({ stockInfo, isLoading }: StockInfoCardProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-16 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stockInfo) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">종목을 검색해주세요</h3>
          <p className="text-sm text-muted-foreground text-center">
            상단 검색창에 종목명이나 종목코드를 입력하여<br />
            기업 정보를 조회할 수 있습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isPositive = stockInfo.change >= 0;
  const trendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColor = isPositive ? "text-success" : "text-danger";
  const bgColor = isPositive ? "bg-success/10" : "bg-danger/10";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold">{stockInfo.name}</CardTitle>
            <p className="text-muted-foreground">{stockInfo.symbol}</p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {stockInfo.sector}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold">
            ₩{stockInfo.price.toLocaleString()}
          </div>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${bgColor}`}>
            {React.createElement(trendIcon, { className: `h-4 w-4 ${trendColor}` })}
            <span className={`font-medium ${trendColor}`}>
              {isPositive ? '+' : ''}{stockInfo.change.toLocaleString()} 
              ({isPositive ? '+' : ''}{stockInfo.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">시가총액</span>
            </div>
            <p className="text-lg font-semibold">{stockInfo.marketCap}</p>
          </div>
          
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">거래량</span>
            </div>
            <p className="text-lg font-semibold">{stockInfo.volume}</p>
          </div>
          
          <div className="p-4 bg-muted/50 rounded-lg col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">최종 업데이트</span>
            </div>
            <p className="text-base font-medium">{stockInfo.lastUpdated}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockInfoCard;