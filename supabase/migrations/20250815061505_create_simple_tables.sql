-- 간단한 DART 고유번호 테이블 생성
CREATE TABLE IF NOT EXISTS dart_codes (
  id SERIAL PRIMARY KEY,
  stock_code VARCHAR(6) NOT NULL,
  company_name TEXT NOT NULL,
  dart_code VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 간단한 재무 데이터 테이블 생성
CREATE TABLE IF NOT EXISTS financial_data (
  id SERIAL PRIMARY KEY,
  stock_code VARCHAR(6) NOT NULL,
  fiscal_year INTEGER NOT NULL,
  revenue BIGINT,
  operating_income BIGINT,
  net_income BIGINT,
  total_assets BIGINT,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(stock_code, fiscal_year)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_dart_codes_stock_code ON dart_codes(stock_code);
CREATE INDEX IF NOT EXISTS idx_financial_data_stock_year ON financial_data(stock_code, fiscal_year);
