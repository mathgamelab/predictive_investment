import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting financial data fetch...');

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Read params
    let stockCode: string | undefined;
    let apiKey: string | undefined;
    try {
      const body = await req.json();
      stockCode = body?.stockCode;
      apiKey = body?.apiKey;
    } catch (_) {}

    if (!stockCode) {
      throw new Error('Stock code is required');
    }

    // If apiKey not provided, fetch from DB table `API`
    if (!apiKey) {
      console.log('No API key provided in request. Fetching from DB...');
      const { data, error } = await supabaseClient
        .from('API')
        .select('API')
        .eq('구분', 'DART')
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        throw new Error('DART API key not found in database table `API`.');
      }
      apiKey = (data as any).API as string;
      console.log('DART API key loaded from DB');
    }

    // Step 1: Get DART code for the stock
    console.log(`Looking up DART code for stock: ${stockCode}`);
    const { data: dartData, error: dartError } = await supabaseClient
      .from('dart_codes')
      .select('dart_code')
      .eq('stock_code', stockCode)
      .single();

    if (dartError || !dartData) {
      throw new Error(`DART code not found for stock: ${stockCode}`);
    }

    const dartCode = dartData.dart_code;
    console.log(`Found DART code: ${dartCode}`);

    // Step 2: Fetch financial data for the last 5 years
    const currentYear = new Date().getFullYear();
    const financialData: any[] = [];

    for (let i = 0; i < 5; i++) {
      const year = currentYear - (i + 1);
      console.log(`Fetching data for year: ${year}`);
      
      const url = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${apiKey}&corp_code=${dartCode}&bsns_year=${year}&reprt_code=11011`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to fetch data for year ${year}: ${response.status}`);
        continue;
      }

      const jsonData = await response.json();
      
      if (jsonData.status === "000" && jsonData.list) {
        const yearData: any = {
          stock_code: stockCode,
          fiscal_year: year,
          revenue: null,
          operating_income: null,
          net_income: null,
          total_assets: null,
          total_liabilities: null,
          total_equity: null,
          cash_flow_operations: null,
          cash_flow_investing: null,
          cash_flow_financing: null,
          raw_data: jsonData
        };

        jsonData.list.forEach((item: any) => {
          const accountName = item.account_nm;
          const amount = item.thstrm_amount ? parseInt(item.thstrm_amount.replace(/,/g, '')) : null;

          switch (accountName) {
            case '매출액':
              yearData.revenue = amount; break;
            case '영업이익':
              yearData.operating_income = amount; break;
            case '당기순이익':
              yearData.net_income = amount; break;
            case '자산총계':
              yearData.total_assets = amount; break;
            case '부채총계':
              yearData.total_liabilities = amount; break;
            case '자본총계':
              yearData.total_equity = amount; break;
            case '영업활동으로인한현금흐름':
              yearData.cash_flow_operations = amount; break;
            case '투자활동으로인한현금흐름':
              yearData.cash_flow_investing = amount; break;
            case '재무활동으로인한현금흐름':
              yearData.cash_flow_financing = amount; break;
          }
        });

        financialData.push(yearData);
      }
    }

    if (financialData.length === 0) {
      throw new Error('No financial data could be retrieved');
    }

    console.log(`Retrieved financial data for ${financialData.length} years`);

    // Step 3: Upsert data
    const { error: upsertError } = await supabaseClient
      .from('financial_data')
      .upsert(financialData, { onConflict: 'stock_code,fiscal_year' });

    if (upsertError) {
      console.error('Error upserting financial data:', upsertError);
      throw new Error(`Failed to upsert financial data: ${upsertError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Financial data for ${stockCode} updated successfully`,
        data_count: financialData.length,
        years: financialData.map(d => d.fiscal_year),
        updated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-financial-data function:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
