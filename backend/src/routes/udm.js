const express = require('express');
const supabaseServer = require('../services/supabaseClient');

const router = express.Router();

function fallbackUsernameFromUserId(userId) {
  return `user_${String(userId).replace(/-/g, '').slice(0, 12)}`;
}

function isProfileComplete(profile) {
  if (!profile) return false;
  const required = [
    profile.age,
    profile.gender,
    profile.country_region,
    profile.height_cm,
    profile.weight_kg,
    profile.activity_level,
    profile.workout_days_per_week,
    profile.diet_type,
    profile.allergies,
    profile.goals
  ];
  return required.every((v) => v !== null && v !== undefined && v !== '');
}

function getRlsClient(req) {
  return supabaseServer.createUserSupabaseClient(req.user.accessToken);
}

async function ensureUserBootstrap(req) {

  // Make the API resilient by creating missing rows using the service role client.
  const userId = req.user.id;
  const email = req.user.email || null;
  const provider = req.user?.raw?.app_metadata?.provider || 'email';

  // Ensure users row exists
  const { data: existingUser, error: existingUserErr } = await supabaseServer
    .from('users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingUserErr) {
    // Tables not created yet
    throw new Error(
      `Supabase table error: ${existingUserErr.message}. Did you run the SQL to create users/user_profiles/plans?`
    );
  }

  if (!existingUser) {
    const { data: defaultPlan, error: planErr } = await supabaseServer
      .from('plans')
      .select('plan_id')
      .eq('is_default', true)
      .maybeSingle();
    if (planErr) throw new Error(planErr.message);

    const { error: insertUserErr } = await supabaseServer.from('users').insert({
      user_id: userId,
      email,
      username: fallbackUsernameFromUserId(userId),
      signup_method: provider,
      status: 'active',
      current_plan_id: defaultPlan?.plan_id ?? null
    });
    if (insertUserErr) throw new Error(insertUserErr.message);
  }

  // Ensure profile row exists
  const { data: existingProfile, error: existingProfileErr } = await supabaseServer
    .from('user_profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (existingProfileErr) throw new Error(existingProfileErr.message);

  if (!existingProfile) {
    const { error: insertProfileErr } = await supabaseServer
      .from('user_profiles')
      .insert({ user_id: userId });
    if (insertProfileErr) throw new Error(insertProfileErr.message);
  }
}

// GET /api/me
router.get('/me', async (req, res) => {
  try {
    await ensureUserBootstrap(req);
    const supabase = getRlsClient(req);

    const { data: userRow, error: userErr } = await supabase
      .from('users')
      .select(
        'user_id,email,username,full_name,signup_method,created_at,status,current_plan_id'
      )
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (userErr) return res.status(500).json({ error: userErr.message });
    if (!userRow) {
      return res.status(500).json({
        error:
          'User row not found (RLS). Verify RLS policies on public.users allow select where user_id = auth.uid().'
      });
    }

    const { data: profileRow, error: profileErr } = await supabase
      .from('user_profiles')
      .select(
        'user_id,age,gender,country_region,height_cm,weight_kg,activity_level,workout_days_per_week,diet_type,allergies,goals,updated_at'
      )
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (profileErr) return res.status(500).json({ error: profileErr.message });

    let plan = null;
    if (userRow?.current_plan_id) {
      const { data: planRow, error: planErr } = await supabase
        .from('plans')
        .select('plan_id,plan_name,plan_description,plan_price,is_default,is_active')
        .eq('plan_id', userRow.current_plan_id)
        .maybeSingle();
      if (planErr) return res.status(500).json({ error: planErr.message });
      plan = planRow;
    }

    return res.json({
      user: userRow,
      profile: profileRow,
      plan,
      profileComplete: isProfileComplete(profileRow)
    });
  } catch (err) {
    console.error('GET /api/me error:', err);
    return res.status(500).json({ error: 'Failed to load user profile' });
  }
});

// PUT /api/me/profile
router.put('/me/profile', async (req, res) => {
  try {
    await ensureUserBootstrap(req);
    const supabase = getRlsClient(req);

    const allowedProfile = [
      'age',
      'gender',
      'country_region',
      'height_cm',
      'weight_kg',
      'activity_level',
      'workout_days_per_week',
      'diet_type',
      'allergies',
      'goals'
    ];

    const profilePatch = {};
    for (const k of allowedProfile) {
      if (k in req.body) profilePatch[k] = req.body[k];
    }

    const { data: updatedProfile, error: profileErr } = await supabase
      .from('user_profiles')
      .update(profilePatch)
      .eq('user_id', req.user.id)
      .select(
        'user_id,age,gender,country_region,height_cm,weight_kg,activity_level,workout_days_per_week,diet_type,allergies,goals,updated_at'
      )
      .maybeSingle();

    if (profileErr) return res.status(400).json({ error: profileErr.message });
    if (!updatedProfile) return res.status(500).json({ error: 'Profile row not found (RLS)' });

    // Allow updating username/full_name separately (users table)
    const userPatch = {};
    if ('username' in req.body) userPatch.username = req.body.username;
    if ('full_name' in req.body) userPatch.full_name = req.body.full_name;

    let updatedUser = null;
    if (Object.keys(userPatch).length > 0) {
      const { data: userRow, error: userErr } = await supabase
        .from('users')
        .update(userPatch)
        .eq('user_id', req.user.id)
        .select('user_id,email,username,full_name,signup_method,created_at,status,current_plan_id')
        .maybeSingle();
      if (userErr) return res.status(400).json({ error: userErr.message });
      updatedUser = userRow;
    }

    return res.json({
      user: updatedUser,
      profile: updatedProfile,
      profileComplete: isProfileComplete(updatedProfile)
    });
  } catch (err) {
    console.error('PUT /api/me/profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/plans
router.get('/plans', async (req, res) => {
  try {
    const supabase = getRlsClient(req);

    const { data, error } = await supabase
      .from('plans')
      .select('plan_id,plan_name,plan_description,plan_price,is_default,is_active')
      .eq('is_active', true)
      .order('plan_price', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ plans: data ?? [] });
  } catch (err) {
    console.error('GET /api/plans error:', err);
    return res.status(500).json({ error: 'Failed to load plans' });
  }
});

// POST /api/me/plan  { plan_id }
router.post('/me/plan', async (req, res) => {
  try {
    const { plan_id } = req.body || {};
    if (!plan_id) return res.status(400).json({ error: 'plan_id is required' });

    const supabase = getRlsClient(req);

    const { data: plan, error: planErr } = await supabase
      .from('plans')
      .select('plan_id,is_active')
      .eq('plan_id', plan_id)
      .single();
    if (planErr) return res.status(400).json({ error: planErr.message });
    if (!plan?.is_active) return res.status(400).json({ error: 'Selected plan is not active' });

    const { data: userRow, error: userErr } = await supabase
      .from('users')
      .update({ current_plan_id: plan_id })
      .eq('user_id', req.user.id)
      .select('user_id,current_plan_id')
      .single();
    if (userErr) return res.status(400).json({ error: userErr.message });

    return res.json({ user: userRow });
  } catch (err) {
    console.error('POST /api/me/plan error:', err);
    return res.status(500).json({ error: 'Failed to update plan' });
  }
});

module.exports = router;




