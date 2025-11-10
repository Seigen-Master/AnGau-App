// Edge Function: Admin Clock In/Out
// Replaces Firebase Cloud Function: adminClockInOut

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Permission denied. Admin access required.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { scheduleId, action, timestamp } = await req.json()

    // Validate required fields
    if (!scheduleId || !action || !['clockIn', 'clockOut'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid arguments. Provide scheduleId and action (clockIn or clockOut)' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the schedule
    const { data: schedule, error: scheduleError } = await supabaseClient
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single()

    if (scheduleError || !schedule) {
      return new Response(
        JSON.stringify({ error: 'Schedule not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const actionTime = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()

    // Handle clock in
    if (action === 'clockIn') {
      if (schedule.status === 'active' || schedule.clock_in) {
        return new Response(
          JSON.stringify({ error: 'Already clocked in' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const { error: updateError } = await supabaseClient
        .from('schedules')
        .update({
          status: 'active',
          clock_in: actionTime
        })
        .eq('id', scheduleId)

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ result: 'Successfully clocked in (admin action)' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Handle clock out
    if (action === 'clockOut') {
      if (schedule.status === 'completed' || schedule.clock_out) {
        return new Response(
          JSON.stringify({ error: 'Already clocked out' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (!schedule.clock_in) {
        return new Response(
          JSON.stringify({ error: 'Cannot clock out before clocking in' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Calculate total hours
      const clockInTime = new Date(schedule.clock_in)
      const clockOutTime = new Date(actionTime)
      const durationMs = clockOutTime.getTime() - clockInTime.getTime()
      const totalHours = Math.round((durationMs / 3600000) * 100) / 100

      const { error: updateError } = await supabaseClient
        .from('schedules')
        .update({
          status: 'completed',
          clock_out: actionTime,
          total_hours: totalHours
        })
        .eq('id', scheduleId)

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          result: 'Successfully clocked out (admin action)',
          totalHours
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

