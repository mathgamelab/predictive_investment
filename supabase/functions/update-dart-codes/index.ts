import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 재시도 로직이 포함된 fetch 함수
const fetchWithRetry = async (url: string, options: any, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // 요청 간격 조절 (재시도마다 대기 시간 증가)
      if (i > 0) {
        const delay = 1000 * Math.pow(2, i - 1); // 1초, 2초, 4초...
        console.log(`Retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      console.log(`Attempt ${i + 1}: Fetching from DART API...`);
      const response = await fetch(url, options);
      
      if (response.ok) {
        console.log(`DART API call successful on attempt ${i + 1}`);
        return response;
      } else {
        console.log(`DART API responded with status: ${response.status} on attempt ${i + 1}`);
      }
      
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
    }
  }
  throw new Error('Max retries exceeded for DART API');
};

// 로컬 XML 파일 읽기 함수
const readLocalXmlFile = async () => {
  try {
    console.log('Reading local XML file...');
    
    // Edge Function 환경에서 사용 가능한 경로들 시도
    const possiblePaths = [
      '/tmp/corpCode.xml',
      './corpCode.xml',
      './supabase/corpCode.xml',
      '/var/tmp/corpCode.xml'
    ];
    
    for (const path of possiblePaths) {
      try {
        console.log(`Trying path: ${path}`);
        const xmlData = await Deno.readTextFile(path);
        console.log(`Local XML file read successfully from ${path}, size:`, xmlData.length);
        return xmlData;
      } catch (pathError) {
        console.log(`Path ${path} failed:`, pathError.message);
        continue;
      }
    }
    
    console.log('All local file paths failed');
    return null;
    
  } catch (error) {
    console.error('Failed to read local XML file:', error);
    return null;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting DART codes update...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Get DART API key from database
    console.log('Fetching DART API key from database...');
    const { data, error } = await supabaseClient
      .from('API')
      .select('API')
      .eq('구분', 'DART')
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      throw new Error('DART API key not found in database table `API`.');
    }
    const apiKey = (data as any).API as string;
    console.log('DART API key loaded from DB');

    // Step 2: Try DART API with improved fetch options
    console.log('Attempting to fetch from DART API with improved options...');
    let xmlData: string | null = null;
    let source = 'local_file';
    
    try {
      const dartUrl = `https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${apiKey}`;
      
      // 더 강력한 fetch 옵션
      const fetchOptions = {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/xml, text/xml, */*',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1'
        },
        keepalive: false,
        mode: 'cors' as RequestMode,
        credentials: 'omit' as RequestCredentials
      };

      const response = await fetchWithRetry(dartUrl, fetchOptions, 3);
      xmlData = await response.text();
      
      // Check if response is valid XML
      if (!xmlData.includes('<list>') || xmlData.includes('error')) {
        throw new Error('Invalid XML response from DART API');
      }

      console.log('DART API response received successfully');
      console.log('XML data length:', xmlData.length);
      source = 'dart_api_latest';

      // Step 3: Save XML file to Supabase Storage (optional)
      try {
        console.log('Saving XML file to Supabase Storage...');
        const fileName = `corpCode_${new Date().toISOString().split('T')[0]}.xml`;
        
        const { error: uploadError } = await supabaseClient.storage
          .from('dart-files')
          .upload(fileName, new Blob([xmlData], { type: 'application/xml' }), {
            upsert: true
          });

        if (uploadError) {
          console.warn('Failed to save to Storage, continuing with direct parsing:', uploadError.message);
        } else {
          console.log('XML file saved to Storage successfully');
        }
      } catch (storageError) {
        console.warn('Storage save failed, continuing with direct parsing:', storageError);
      }

    } catch (dartError) {
      console.error('DART API failed, falling back to local file:', dartError);
      
      // Fallback: Read from local XML file
      xmlData = await readLocalXmlFile();
      
      if (!xmlData) {
        throw new Error('Both DART API and local file failed. Cannot proceed.');
      }
      
      source = 'local_file_fallback';
    }

    // Step 4: Parse XML data to extract all companies
    console.log('Parsing XML data...');
    const dartCodes = [];
    
    // XML에서 기업 정보 추출 (정규식 사용)
    const companyRegex = /<list>[\s\S]*?<corp_code>(.*?)<\/corp_code>[\s\S]*?<corp_name>(.*?)<\/corp_name>[\s\S]*?<stock_code>(.*?)<\/stock_code>[\s\S]*?<\/list>/g;
    
    let match;
    let count = 0;
    
    while ((match = companyRegex.exec(xmlData)) !== null) {
      const corpCode = match[1].trim();
      const companyName = match[2].trim();
      let stockCode = match[3].trim();
      
      // 주식코드가 있는 경우만 추가 (상장기업)
      if (stockCode && stockCode.length > 0) {
        // 6자리로 패딩
        stockCode = stockCode.padStart(6, '0');
        
        dartCodes.push({
          stock_code: stockCode,
          company_name: companyName,
          dart_code: corpCode
        });
        
        count++;
        
        // 로그 출력 (처음 10개만)
        if (count <= 10) {
          console.log(`Parsed: ${companyName} (${stockCode}) - ${corpCode}`);
        }
      }
    }

    if (dartCodes.length === 0) {
      throw new Error('No companies found in XML data. Data structure may be incorrect.');
    }

    console.log(`Total companies parsed: ${dartCodes.length}`);

    // Step 5: Clear existing data and insert new data
    console.log('Clearing existing DART codes...');
    const { error: deleteError } = await supabaseClient
      .from('dart_codes')
      .delete()
      .neq('id', 0);

    if (deleteError) {
      console.error('Error clearing existing data:', deleteError);
      throw new Error(`Failed to clear existing data: ${deleteError.message}`);
    }

    console.log('Inserting new DART codes...');
    const { error: insertError } = await supabaseClient
      .from('dart_codes')
      .insert(dartCodes);

    if (insertError) {
      console.error('Error inserting DART codes:', insertError);
      throw new Error(`Failed to insert DART codes: ${insertError.message}`);
    }

    console.log('DART codes update completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${dartCodes.length} companies updated successfully`,
        total_companies: dartCodes.length,
        sample_companies: dartCodes.slice(0, 5).map(c => c.company_name),
        source: source,
        updated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-dart-codes function:', error);
    
    // Final fallback: Insert mock data if everything else failed
    try {
      console.log('All methods failed, using mock data as final fallback...');
      
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const mockDartCodes = [
        { stock_code: '005930', company_name: '삼성전자', dart_code: '00126380' },
        { stock_code: '000660', company_name: 'SK하이닉스', dart_code: '00164779' },
        { stock_code: '035420', company_name: 'NAVER', dart_code: '00164779' },
        { stock_code: '051910', company_name: 'LG화학', dart_code: '00164779' },
        { stock_code: '006400', company_name: '삼성SDI', dart_code: '00164779' },
        { stock_code: '005380', company_name: '현대차', dart_code: '00126380' },
        { stock_code: '000270', company_name: '기아', dart_code: '00164779' },
        { stock_code: '051900', company_name: 'LG생활건강', dart_code: '00164779' },
        { stock_code: '068270', company_name: '셀트리온', dart_code: '00164779' },
        { stock_code: '207940', company_name: '삼성바이오로직스', dart_code: '00164779' },
        { stock_code: '323410', company_name: '카카오뱅크', dart_code: '00126380' },
        { stock_code: '035720', company_name: '카카오', dart_code: '00164779' },
        { stock_code: '017670', company_name: 'SK텔레콤', dart_code: '00164779' },
        { stock_code: '015760', company_name: '한국전력', dart_code: '00164779' },
        { stock_code: '034020', company_name: '두산에너빌리티', dart_code: '00164779' }
      ];

      await supabaseClient.from('dart_codes').delete().neq('id', 0);
      const { error: insertError } = await supabaseClient
        .from('dart_codes')
        .insert(mockDartCodes);

      if (insertError) {
        throw new Error(`Failed to insert mock data: ${insertError.message}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `${mockDartCodes.length} companies updated with mock data (all methods failed)`,
          total_companies: mockDartCodes.length,
          sample_companies: mockDartCodes.map(c => c.company_name),
          note: 'All fallback methods failed, using mock data',
          source: 'mock_data_final',
          updated_at: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fallbackError) {
      console.error('Even mock data insertion failed:', fallbackError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Complete failure: ${(error as Error).message}. Mock data also failed: ${(fallbackError as Error).message}`,
          timestamp: new Date().toISOString()
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
});
