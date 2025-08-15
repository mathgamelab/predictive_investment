import { useState } from "react";
import StockSearchHeader from "@/components/StockSearchHeader";
import StockInfoCard from "@/components/StockInfoCard";
import AnalysisSection from "@/components/AnalysisSection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isUpdatingStocks, setIsUpdatingStocks] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (symbol: string) => {
    setIsLoading(true);
    
    try {
      // 종목코드 또는 회사명으로 DB에서 검색
      const { data: stockData, error } = await supabase
        .from('stocks')
        .select('*')
        .or(`stock_code.eq.${symbol},company_name.ilike.%${symbol}%`)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (stockData) {
        const dummyStock = {
          symbol: stockData.stock_code,
          name: stockData.company_name,
          price: 71500,
          change: 1200,
          changePercent: 1.71,
          marketCap: "428조원",
          sector: stockData.market,
          volume: "15.2M",
          lastUpdated: new Date().toLocaleString('ko-KR')
        };

        const dummyAnalysis = {
          overallScore: 78,
          financialHealth: 85,
          growthPotential: 72,
          valuation: 68,
          risk: 25,
          recommendation: "매수" as const,
          keyPoints: [
            "글로벌 반도체 시장에서의 강력한 입지",
            "안정적인 현금흐름과 높은 배당수익률",
            "AI 및 메모리 반도체 수요 증가 수혜 예상",
            "ESG 경영 강화로 지속가능한 성장 기반 마련"
          ],
          warnings: [
            "중국 시장 의존도가 높아 지정학적 리스크 존재",
            "반도체 사이클의 변동성에 따른 실적 변동 가능성",
            "환율 변동이 수익성에 미치는 영향 고려 필요"
          ]
        };

        setSelectedStock(dummyStock);
        setAnalysisData(dummyAnalysis);
      } else {
        toast({
          title: "종목을 찾을 수 없습니다",
          description: "입력하신 종목코드나 회사명을 다시 확인해주세요.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Stock search error:', error);
      toast({
        title: "검색 중 오류가 발생했습니다",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateStockList = async () => {
    setIsUpdatingStocks(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('update-stock-list');
      
      if (error) {
        throw error;
      }

      toast({
        title: "종목 리스트 업데이트 완료",
        description: `${data.message}`,
      });
    } catch (error) {
      console.error('Stock list update error:', error);
      toast({
        title: "업데이트 실패",
        description: "종목 리스트 업데이트 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingStocks(false);
    }
  };

  const handleGenerateReport = () => {
    // 보고서 생성 로직
    console.log("보고서 생성 중...");
  };

  return (
    <div className="min-h-screen bg-background">
      <StockSearchHeader onSearch={handleSearch} />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-end mb-4">
          <Button 
            onClick={updateStockList}
            disabled={isUpdatingStocks}
            variant="outline"
          >
            {isUpdatingStocks ? "업데이트 중..." : "KRX 종목 리스트 업데이트"}
          </Button>
        </div>
        
        <StockInfoCard stockInfo={selectedStock} isLoading={isLoading} />
        <AnalysisSection 
          analysisData={analysisData} 
          isLoading={isLoading} 
          onGenerateReport={handleGenerateReport}
        />
      </main>
    </div>
  );
};

export default Index;
