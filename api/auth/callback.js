// OAuth callback — exchanges code for tokens and redirects back to app
export default async function handler(req, res) {
  const { code, error } = req.query;
  
  if (error) {
    return res.redirect(`/?oauth_error=${encodeURIComponent(error)}`);
  }
  
  if (!code) {
    return res.redirect("/?oauth_error=no_code");
  }

  // Redirect back to app with code — app will exchange for tokens
  return res.redirect(`/?oauth_code=${encodeURIComponent(code)}`);
}
