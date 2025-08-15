import { useState } from "react";
import StockSearchHeader from "@/components/StockSearchHeader";
import StockInfoCard from "@/components/StockInfoCard";
import AnalysisSection from "@/components/AnalysisSection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Lock } from "lucide-react";

const Index = () => {
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isUpdatingStocks, setIsUpdatingStocks] = useState(false);
  const [isUpdatingDartCodes, setIsUpdatingDartCodes] = useState(false);
  const [isFetchingFinancialData, setIsFetchingFinancialData] = useState(false);
  const [financialData, setFinancialData] = useState<any>(null);
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

  const updateDartCodes = async () => {
    setIsUpdatingDartCodes(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('update-dart-codes');
      
      if (error) {
        throw error;
      }

      toast({
        title: "DART 고유번호 업데이트 완료",
        description: `${data.message}`,
      });
    } catch (error) {
      console.error('DART codes update error:', error);
      toast({
        title: "업데이트 실패",
        description: "DART 고유번호 업데이트 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingDartCodes(false);
    }
  };

  const fetchFinancialData = async () => {
    if (!selectedStock) {
      toast({
        title: "종목을 먼저 선택해주세요",
        description: "분석할 종목을 검색하여 선택한 후 재무 데이터 분석을 진행해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsFetchingFinancialData(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-financial-data', {
        body: { stockCode: selectedStock.symbol }
      });
      
      if (error) {
        throw error;
      }

      // 재무 데이터를 가져와서 표시
      const { data: financialDataFromDB, error: fetchError } = await supabase
        .from('financial_data')
        .select('*')
        .eq('stock_code', selectedStock.symbol)
        .order('fiscal_year', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setFinancialData(financialDataFromDB);

      toast({
        title: "재무 데이터 수집 완료",
        description: `${data.message}`,
      });
    } catch (error) {
      console.error('Financial data fetch error:', error);
      toast({
        title: "데이터 수집 실패",
        description: "재무 데이터 수집 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsFetchingFinancialData(false);
    }
  };

  const handleGenerateReport = () => {
    // 보고서 생성 로직
    console.log("보고서 생성 중...");
  };

  const testStorageConnection = async () => {
    try {
      // Edge Function을 호출하여 Storage 연결을 테스트
      const { data, error } = await supabase.functions.invoke('test-storage');
      if (error) {
        throw error;
      }
      
      if (data.success) {
        toast({
          title: "Storage 연결 테스트 성공",
          description: "모든 Storage 테스트가 통과했습니다.",
        });
      } else {
        throw new Error(data.error || 'Storage 테스트 실패');
      }
    } catch (error) {
      console.error('Storage connection test error:', error);
      toast({
        title: "Storage 연결 테스트 실패",
        description: error instanceof Error ? error.message : "Storage 연결에 문제가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <StockSearchHeader onSearch={handleSearch} />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* 분석 환경 설정 패널 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              분석 환경 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={updateDartCodes}
                disabled={isUpdatingDartCodes}
                className="flex-1"
              >
                {isUpdatingDartCodes ? '업데이트 중...' : 'DART 고유번호 업데이트'}
              </Button>
              <Button 
                onClick={updateStockList}
                disabled={isUpdatingStocks}
                className="flex-1"
              >
                {isUpdatingStocks ? "업데이트 중..." : "KRX 종목 리스트 업데이트"}
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={testStorageConnection}
                variant="outline"
                className="flex-1"
              >
                Storage 연결 테스트
              </Button>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Lock className="h-4 w-4" />
              API 키는 자동으로 데이터베이스에서 가져옵니다. 별도 입력이 필요 없습니다.
            </div>
          </CardContent>
        </Card>
        
        <StockInfoCard stockInfo={selectedStock} isLoading={isLoading} />
        
        {/* 재무 데이터 분석 섹션 */}
        {selectedStock && (
          <Card>
            <CardHeader>
              <CardTitle>📊 재무 데이터 분석</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {selectedStock.name}의 최근 5년간 재무 데이터를 분석합니다.
                </p>
                <Button 
                  onClick={fetchFinancialData}
                  disabled={isFetchingFinancialData}
                >
                  {isFetchingFinancialData ? "분석 중..." : "재무 데이터 분석 시작"}
                </Button>
              </div>
              
              {financialData && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">연도</th>
                        <th className="text-right p-2">매출액</th>
                        <th className="text-right p-2">영업이익</th>
                        <th className="text-right p-2">당기순이익</th>
                        <th className="text-right p-2">총자산</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialData.map((data: any) => (
                        <tr key={data.fiscal_year} className="border-b">
                          <td className="p-2">{data.fiscal_year}</td>
                          <td className="text-right p-2">
                            {data.revenue ? `${(data.revenue / 100000000).toFixed(0)}억원` : 'N/A'}
                          </td>
                          <td className="text-right p-2">
                            {data.operating_income ? `${(data.operating_income / 100000000).toFixed(0)}억원` : 'N/A'}
                          </td>
                          <td className="text-right p-2">
                            {data.net_income ? `${(data.net_income / 100000000).toFixed(0)}억원` : 'N/A'}
                          </td>
                          <td className="text-right p-2">
                            {data.total_assets ? `${(data.total_assets / 100000000).toFixed(0)}억원` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
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
