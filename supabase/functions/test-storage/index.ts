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
    console.log('Testing Storage connection...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Test 1: Check if bucket exists
    console.log('Step 1: Checking if dart-files bucket exists...');
    try {
      const { data: buckets, error: bucketError } = await supabaseClient.storage.listBuckets();
      
      if (bucketError) {
        console.error('Error listing buckets:', bucketError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to list buckets: ${bucketError.message}`,
            step: 'list_buckets'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const dartBucket = buckets?.find(b => b.name === 'dart-files');
      if (!dartBucket) {
        console.log('dart-files bucket not found, creating it...');
        
        const { error: createError } = await supabaseClient.storage.createBucket('dart-files', {
          public: true
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Failed to create bucket: ${createError.message}`,
              step: 'create_bucket'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.log('dart-files bucket created successfully');
      } else {
        console.log('dart-files bucket exists');
      }
    } catch (error) {
      console.error('Error in bucket check:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Bucket check failed: ${(error as Error).message}`,
          step: 'bucket_check'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test 2: Try to upload a test file
    console.log('Step 2: Testing file upload...');
    try {
      const testContent = 'This is a test file for DART codes';
      const testFileName = `test_${Date.now()}.txt`;
      
      const { error: uploadError } = await supabaseClient.storage
        .from('dart-files')
        .upload(testFileName, new Blob([testContent], { type: 'text/plain' }));

      if (uploadError) {
        console.error('Error uploading test file:', uploadError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to upload test file: ${uploadError.message}`,
            step: 'upload_test'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Test file uploaded successfully');
    } catch (error) {
      console.error('Error in file upload test:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `File upload test failed: ${(error as Error).message}`,
          step: 'upload_test'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test 3: Try to list files
    console.log('Step 3: Testing file listing...');
    try {
      const { data: files, error: listError } = await supabaseClient.storage
        .from('dart-files')
        .list('', { limit: 10 });

      if (listError) {
        console.error('Error listing files:', listError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to list files: ${listError.message}`,
            step: 'list_files'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Files listed successfully:', files?.length || 0, 'files found');
    } catch (error) {
      console.error('Error in file listing test:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `File listing test failed: ${(error as Error).message}`,
          step: 'list_files'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Storage connection test completed successfully',
        steps_completed: ['bucket_check', 'upload_test', 'list_files'],
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in storage test function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message,
        step: 'general_error',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
