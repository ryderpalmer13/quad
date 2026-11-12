// Server only. Who counts as an Agora U admin.
// Set ADMIN_EMAILS in Vercel to a comma separated list of login emails. Not a public variable.
export function isAdmin(user) {
  if (!user || !user.email) return false
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(String(user.email).toLowerCase())
}
