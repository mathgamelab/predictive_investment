import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting KRX stock list update...');

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Generate OTP from KRX
    const otpGenerateUrl = 'http://data.krx.co.kr/comm/fileDn/GenerateOTP/generate.cmd';
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    const otpPayload = new URLSearchParams({
      bld: 'dbms/MDC/STAT/standard/MDCSTAT01901',
      mktId: 'ALL',
      trdDd: today,
      share: '1',
      money: '1',
      csvxls_isNo: 'false',
      name: 'fileDown',
      url: 'dbms/MDC/STAT/standard/MDCSTAT01901'
    });

    console.log('Generating OTP from KRX...');
    const otpResponse = await fetch(otpGenerateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: otpPayload
    });

    if (!otpResponse.ok) {
      throw new Error(`OTP generation failed: ${otpResponse.status}`);
    }

    const otpCode = await otpResponse.text();
    console.log('OTP generated successfully');

    // Step 2: Download CSV data using OTP
    const downloadUrl = 'http://data.krx.co.kr/comm/fileDn/download_csv/download.cmd';
    const downloadPayload = new URLSearchParams({
      code: otpCode.trim()
    });

    console.log('Downloading CSV data from KRX...');
    const csvResponse = await fetch(downloadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: downloadPayload
    });

    if (!csvResponse.ok) {
      throw new Error(`CSV download failed: ${csvResponse.status}`);
    }

    const csvBuffer = await csvResponse.arrayBuffer();
    const decoder = new TextDecoder('euc-kr');
    const csvData = decoder.decode(csvBuffer);

    console.log('CSV data downloaded successfully');

    // Step 3: Parse CSV data
    const lines = csvData.split('\n').filter(line => line.trim());
    const dataRows = lines.slice(1); // Skip header row

    const stockData = dataRows.map(row => {
      const columns = row.split(',').map(col => col.replace(/"/g, '').trim());
      
      if (columns.length < 7) return null;

      const stockCode = columns[0].padStart(6, '0');
      const isinCode = columns[1];
      const companyName = columns[2];
      const market = columns[6];
      const listingDate = columns[5];

      return {
        company_name: companyName,
        stock_code: stockCode,
        isin_code: isinCode,
        market: market,
        listing_date: listingDate
      };
    }).filter(item => item !== null);

    console.log(`Parsed ${stockData.length} stock records`);

    // Step 4: Clear existing data and insert new data
    console.log('Clearing existing stock data...');
    const { error: deleteError } = await supabaseClient
      .from('stocks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (deleteError) {
      console.error('Error clearing existing data:', deleteError);
      throw new Error(`Failed to clear existing data: ${deleteError.message}`);
    }

    console.log('Inserting new stock data...');
    const { error: insertError } = await supabaseClient
      .from('stocks')
      .insert(stockData);

    if (insertError) {
      console.error('Error inserting stock data:', insertError);
      throw new Error(`Failed to insert stock data: ${insertError.message}`);
    }

    console.log('Stock list update completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${stockData.length} stocks updated successfully`,
        updated_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in update-stock-list function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});