import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp } from "lucide-react";
import { useState } from "react";

interface StockSearchHeaderProps {
  onSearch: (symbol: string) => void;
}

const StockSearchHeader = ({ onSearch }: StockSearchHeaderProps) => {
  const [searchValue, setSearchValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-card/95">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">주식투자 분석도구</h1>
              <p className="text-muted-foreground">종목 분석 및 투자 인사이트</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="종목명 또는 종목코드를 입력하세요 (예: 삼성전자, 005930)"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 h-12 text-base border-2 focus:border-primary"
            />
          </div>
          <Button 
            type="submit" 
            size="lg" 
            className="px-8 h-12 bg-primary hover:bg-primary-hover text-primary-foreground font-medium"
          >
            검색
          </Button>
        </form>
      </div>
    </header>
  );
};

export default StockSearchHeader;