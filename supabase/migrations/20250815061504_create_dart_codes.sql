-- DART 고유번호 테이블 생성
CREATE TABLE IF NOT EXISTS dart_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_code VARCHAR(6) NOT NULL,
  company_name TEXT NOT NULL,
  dart_code VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 재무 데이터 테이블 생성
CREATE TABLE IF NOT EXISTS financial_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_code VARCHAR(6) NOT NULL,
  fiscal_year INTEGER NOT NULL,
  revenue BIGINT, -- 매출액
  operating_income BIGINT, -- 영업이익
  net_income BIGINT, -- 당기순이익
  total_assets BIGINT, -- 총자산
  total_liabilities BIGINT, -- 총부채
  total_equity BIGINT, -- 자본총계
  cash_flow_operations BIGINT, -- 영업현금흐름
  cash_flow_investing BIGINT, -- 투자현금흐름
  cash_flow_financing BIGINT, -- 재무현금흐름
  raw_data JSONB, -- DART 원본 데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(stock_code, fiscal_year)
);

-- 산업 분석 데이터 테이블 생성
CREATE TABLE IF NOT EXISTS industry_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sector TEXT NOT NULL,
  industry TEXT NOT NULL,
  avg_per DECIMAL(10,2), -- 업종 평균 PER
  avg_pbr DECIMAL(10,2), -- 업종 평균 PBR
  growth_rate DECIMAL(5,2), -- 업종 성장률
  market_cap BIGINT, -- 업종 시가총액
  company_count INTEGER, -- 업종 기업 수
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 이벤트 및 뉴스 데이터 테이블 생성
CREATE TABLE IF NOT EXISTS event_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_code VARCHAR(6),
  event_type TEXT NOT NULL, -- '공시', '뉴스', '거시경제'
  title TEXT NOT NULL,
  content TEXT,
  impact_score INTEGER CHECK (impact_score >= -5 AND impact_score <= 5), -- 영향도 점수 (-5: 매우 부정적, +5: 매우 긍정적)
  event_date DATE NOT NULL,
  source TEXT, -- 출처 (DART, 뉴스 등)
  raw_data JSONB, -- 원본 데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_dart_codes_stock_code ON dart_codes(stock_code);
CREATE INDEX IF NOT EXISTS idx_financial_data_stock_year ON financial_data(stock_code, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_industry_data_sector ON industry_data(sector);
CREATE INDEX IF NOT EXISTS idx_event_data_stock_date ON event_data(stock_code, event_date);

-- RLS 정책 설정 (필요시)
-- ALTER TABLE dart_codes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE financial_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE industry_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE event_data ENABLE ROW LEVEL SECURITY;
