import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, PieChart, FileText, Download, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

interface AnalysisData {
  overallScore: number;
  financialHealth: number;
  growthPotential: number;
  valuation: number;
  risk: number;
  recommendation: "매수" | "보유" | "매도";
  keyPoints: string[];
  warnings: string[];
}

interface AnalysisSectionProps {
  analysisData?: AnalysisData | null;
  isLoading?: boolean;
  onGenerateReport?: () => void;
}

const AnalysisSection = ({ analysisData, isLoading, onGenerateReport }: AnalysisSectionProps) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="animate-pulse space-y-2">
              <div className="h-6 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-muted rounded"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-muted rounded"></div>
                <div className="h-24 bg-muted rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">분석 결과를 기다리는 중</h3>
          <p className="text-sm text-muted-foreground text-center">
            종목을 검색하면 AI 기반 분석 결과를<br />
            자동으로 생성해드립니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-danger";
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "매수": return "bg-success text-success-foreground";
      case "보유": return "bg-warning text-warning-foreground";
      case "매도": return "bg-danger text-danger-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* 종합 점수 및 추천 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            투자 분석 결과
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-3xl font-bold mb-1">
                <span className={getScoreColor(analysisData.overallScore)}>
                  {analysisData.overallScore}점
                </span>
              </div>
              <p className="text-muted-foreground">종합 투자 점수</p>
            </div>
            <Badge 
              className={`${getRecommendationColor(analysisData.recommendation)} text-lg px-4 py-2 font-bold`}
            >
              {analysisData.recommendation}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${getScoreColor(analysisData.financialHealth)}`}>
                {analysisData.financialHealth}
              </div>
              <p className="text-sm text-muted-foreground">재무건전성</p>
              <Progress value={analysisData.financialHealth} className="mt-2" />
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${getScoreColor(analysisData.growthPotential)}`}>
                {analysisData.growthPotential}
              </div>
              <p className="text-sm text-muted-foreground">성장성</p>
              <Progress value={analysisData.growthPotential} className="mt-2" />
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${getScoreColor(analysisData.valuation)}`}>
                {analysisData.valuation}
              </div>
              <p className="text-sm text-muted-foreground">밸류에이션</p>
              <Progress value={analysisData.valuation} className="mt-2" />
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${getScoreColor(100 - analysisData.risk)}`}>
                {100 - analysisData.risk}
              </div>
              <p className="text-sm text-muted-foreground">안정성</p>
              <Progress value={100 - analysisData.risk} className="mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 핵심 포인트 및 경고사항 */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              투자 포인트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysisData.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              주의사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysisData.warnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-warning rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm">{warning}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* 액션 버튼들 */}
      <div className="flex gap-3 justify-center">
        <Button variant="outline" className="flex items-center gap-2">
          <PieChart className="h-4 w-4" />
          상세 차트 보기
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={onGenerateReport}
        >
          <FileText className="h-4 w-4" />
          분석 보고서 생성
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          PDF 다운로드
        </Button>
      </div>
    </div>
  );
};

export default AnalysisSection;