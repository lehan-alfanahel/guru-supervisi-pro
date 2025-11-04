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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== CREATE TEACHER ACCOUNT REQUEST ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    // Get and verify authentication
    const authHeader = req.headers.get("Authorization");
    console.log('Auth header present:', !!authHeader);
    console.log('Auth header value:', authHeader ? authHeader.substring(0, 20) + '...' : 'null');
    
    if (!authHeader) {
      console.error('ERROR: No authorization header found');
      return new Response(
        JSON.stringify({ error: "Unauthorized - No auth header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Extract token from Bearer header
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);

    // Create client with anon key to verify JWT
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    console.log('Verifying JWT token...');
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    
    if (userError) {
      console.error('ERROR verifying JWT:', userError);
      return new Response(
        JSON.stringify({ error: `Auth error: ${userError.message}` }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }
    
    console.log('User from auth:', { userId: user?.id, email: user?.email });
    
    if (!user) {
      console.error('ERROR: No user found from token');
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Use service role to check school ownership (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify user owns a school
    console.log('Checking if user owns a school...');
    const { data: school, error: schoolError } = await supabaseAdmin
      .from("schools")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    console.log('School check:', { schoolId: school?.id, error: schoolError });

    if (schoolError || !school) {
      console.error('ERROR: No school found for user');
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
    
    // Check if user with this email already exists
    console.log('Checking if user exists with email:', email);
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({ error: `Gagal memeriksa user: ${listError.message}` }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const existingUser = users?.find(u => u.email === email);
    let userId: string;
    let temporaryPassword: string | null = null;

    if (existingUser) {
      console.log('User already exists:', existingUser.id);
      userId = existingUser.id;
      
      // Check if this user is already linked to a teacher account in this school
      const { data: existingAccount } = await supabaseAdmin
        .from('teacher_accounts')
        .select('id, teacher_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingAccount) {
        return new Response(
          JSON.stringify({ error: 'Email ini sudah digunakan untuk akun guru lain' }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
    } else {
      // Generate a secure random password if not provided
      const finalPassword = password || crypto.randomUUID().replace(/-/g, '').substring(0, 16);
      temporaryPassword = finalPassword;

      // Create new user account
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: finalPassword,
        email_confirm: true,
      });

      if (authError) {
        console.error("Auth error creating teacher:", authError);
        console.error("Auth error details:", JSON.stringify(authError, null, 2));
        return new Response(
          JSON.stringify({ error: `Gagal membuat akun guru: ${authError.message || 'Unknown error'}` }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }

      if (!authData.user) {
        return new Response(
          JSON.stringify({ error: 'Gagal membuat user' }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }

      userId = authData.user.id;
      console.log('New user created:', userId);
    }

    // Create teacher_accounts entry if teacherId provided
    if (teacherId) {
      const { error: accountLinkError } = await supabaseAdmin
        .from('teacher_accounts')
        .insert({
          teacher_id: teacherId,
          user_id: userId,
          email: email,
        });

      if (accountLinkError) {
        console.error("Error linking teacher account:", accountLinkError);
        return new Response(
          JSON.stringify({ error: `Gagal menghubungkan akun: ${accountLinkError.message}` }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
    }

    console.log(`Teacher account created/linked by user ${user.id} for school ${school.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: userId,
        temporaryPassword: temporaryPassword
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
