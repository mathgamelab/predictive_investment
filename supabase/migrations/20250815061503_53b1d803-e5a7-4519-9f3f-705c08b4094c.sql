-- 종목 정보를 저장할 테이블 생성
CREATE TABLE public.stocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  stock_code TEXT NOT NULL UNIQUE, -- 6자리 종목코드
  isin_code TEXT NOT NULL, -- 12자리 표준코드
  market TEXT NOT NULL, -- 시장구분 (KOSPI, KOSDAQ 등)
  listing_date TEXT, -- 상장일
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화 (공개 데이터이므로 모든 사용자가 읽기 가능)
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 종목 데이터를 읽을 수 있도록 정책 생성
CREATE POLICY "Anyone can view stocks" 
ON public.stocks 
FOR SELECT 
USING (true);

-- 관리자만 데이터를 업데이트할 수 있도록 제한 (추후 필요시 수정)
CREATE POLICY "Only authenticated users can insert stocks" 
ON public.stocks 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update stocks" 
ON public.stocks 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- 업데이트 시간 자동 갱신을 위한 함수 생성
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_stocks_updated_at
BEFORE UPDATE ON public.stocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 종목코드로 빠른 검색을 위한 인덱스
CREATE INDEX idx_stocks_stock_code ON public.stocks(stock_code);
CREATE INDEX idx_stocks_company_name ON public.stocks(company_name);
CREATE INDEX idx_stocks_market ON public.stocks(market);