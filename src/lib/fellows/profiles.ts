/**
 * Public Fellow profile: live Fellows only, no contact details. Kept as SQL in
 * code (not a database view) so it needs no extra privileges on shared hosting.
 * Use as a derived table: `JOIN (${FELLOW_PROFILES}) fp ON fp.id = ...`.
 */
export const FELLOW_PROFILES = `SELECT f.account_id AS id, f.display_name, f.college, f.worlds, f.languages, f.tier,
  (SELECT FLOOR(COALESCE(SUM(g.duration_min), 0) / 60) FROM gig_assignments ga JOIN gigs g ON g.id = ga.gig_id WHERE ga.fellow_id = f.account_id AND ga.status = 'delivered') AS hours_taught,
  (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.fellow_id = f.account_id AND NOT r.hidden) AS rating,
  (SELECT COUNT(*) FROM reviews r WHERE r.fellow_id = f.account_id AND NOT r.hidden) AS review_count,
  (SELECT JSON_ARRAYAGG(v.step) FROM vetting_steps v WHERE v.fellow_id = f.account_id AND v.status = 'passed' AND v.step IN ('identity','background','academy','subject_test')) AS verified
  FROM fellows f WHERE f.status = 'live'`;
