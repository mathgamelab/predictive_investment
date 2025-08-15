import { useState } from "react";
import StockSearchHeader from "@/components/StockSearchHeader";
import StockInfoCard from "@/components/StockInfoCard";
import AnalysisSection from "@/components/AnalysisSection";

const Index = () => {
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);

  const handleSearch = async (symbol: string) => {
    setIsLoading(true);
    
    // 임시 더미 데이터 - 실제로는 API 호출할 예정
    setTimeout(() => {
      const dummyStock = {
        symbol: symbol.toUpperCase(),
        name: symbol === "005930" || symbol.toLowerCase().includes("삼성") ? "삼성전자" : `${symbol} 주식회사`,
        price: 71500,
        change: 1200,
        changePercent: 1.71,
        marketCap: "428조원",
        sector: "기술 하드웨어 및 장비",
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
      setIsLoading(false);
    }, 1500);
  };

  const handleGenerateReport = () => {
    // 보고서 생성 로직
    console.log("보고서 생성 중...");
  };

  return (
    <div className="min-h-screen bg-background">
      <StockSearchHeader onSearch={handleSearch} />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
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
