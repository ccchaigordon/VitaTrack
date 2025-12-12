const supabaseServer = require('../services/supabaseClient');

async function supabaseAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Malformed authorization header' });

    const { data, error } = await supabaseServer.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
      raw: data.user,
      accessToken: token
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Auth verification failed' });
  }
}

module.exports = supabaseAuth;