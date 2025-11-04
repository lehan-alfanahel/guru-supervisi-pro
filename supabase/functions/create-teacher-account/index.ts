import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const createTeacherSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().optional(),
  teacherId: z.string().uuid().optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get and verify authentication
    const authHeader = req.headers.get("Authorization");
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(
        JSON.stringify({ error: "Unauthorized - No auth header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Create client with user's auth to verify permissions
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    console.log('User from auth:', { userId: user?.id, email: user?.email });
    
    if (!user) {
      console.error('No user found from token');
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Verify user owns a school
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (schoolError || !school) {
      return new Response(
        JSON.stringify({ error: "No school found for this user" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Validate input
    const body = await req.json();
    const validation = createTeacherSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validation.error.errors 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const { email, password, teacherId } = validation.data;
    // Generate a secure random password if not provided
    const finalPassword = password || crypto.randomUUID().replace(/-/g, '').substring(0, 16);

    // Create admin client for user creation with fixed search_path
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: 'public'
        }
      }
    );

    // Create user account with admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: finalPassword,
      email_confirm: true,
    });

    if (authError) {
      // Log detailed error server-side for debugging
      console.error("Auth error creating teacher:", authError);
      console.error("Auth error details:", JSON.stringify(authError, null, 2));
      // Return error with details to client
      return new Response(
        JSON.stringify({ error: `Gagal membuat akun guru: ${authError.message || 'Unknown error'}` }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // If teacherId provided, create teacher_accounts entry
    if (teacherId && authData.user) {
      const { error: accountLinkError } = await supabase
        .from('teacher_accounts')
        .insert({
          teacher_id: teacherId,
          user_id: authData.user.id,
          email: email,
        });

      if (accountLinkError) {
        console.error("Error linking teacher account:", accountLinkError);
      }
    }

    console.log(`Teacher account created by user ${user.id} for school ${school.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: authData.user?.id,
        temporaryPassword: finalPassword
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    // Log full error details server-side for debugging
    console.error("Error creating teacher account:", error);
    // Return sanitized generic error to client
    return new Response(
      JSON.stringify({ error: "Gagal membuat akun guru" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
