/**
 * Optional database hardening. Triggers back up rules the app already
 * enforces. Shared hosting (Hostinger) may not allow CREATE TRIGGER when
 * binary logging is on; the migration then warns and carries on, and the
 * app-level rules (and their tests) still apply.
 */
const appendOnly = ["consent_events", "audit_log", "ledger_journals", "ledger_postings", "terms_acceptances"];

export const hardening = [
  ...appendOnly.flatMap((t) => [
    [`${t}_no_update`, `CREATE TRIGGER ${t}_no_update BEFORE UPDATE ON ${t} FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '${t} is append-only'`],
    [`${t}_no_delete`, `CREATE TRIGGER ${t}_no_delete BEFORE DELETE ON ${t} FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '${t} is append-only'`],
  ]),
  // Contact details in messages are blocked here as well as in app code.
  ["messages_block_contacts", `CREATE TRIGGER messages_block_contacts BEFORE INSERT ON messages FOR EACH ROW
    BEGIN
      IF NEW.body REGEXP '([+]?[0-9][0-9 ().-]{7,}[0-9])|([[:alnum:]._%+-]+@[[:alnum:].-]+[.][a-z]{2,})|(https?://|www[.])|(whats ?app|wa[.]me|instagram|insta |snapchat|telegram|t[.]me|facebook|fb[.]com|discord)|(^|[[:space:]])@[[:alnum:]_.]{3,}'
      THEN SET NEW.blocked = TRUE; END IF;
    END`],
  ["messages_no_unblock", `CREATE TRIGGER messages_no_unblock BEFORE UPDATE ON messages FOR EACH ROW
    BEGIN IF OLD.blocked AND NOT NEW.blocked THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'blocked messages stay blocked'; END IF; END`],
  // Fellows may change only their availability. The app sets @rk_role per transaction.
  ["fellows_guard", `CREATE TRIGGER fellows_guard BEFORE UPDATE ON fellows FOR EACH ROW
    BEGIN
      IF COALESCE(@rk_role, '') = 'fellow' AND (
           NOT (NEW.status <=> OLD.status) OR NOT (NEW.tier <=> OLD.tier) OR NOT (NEW.weekly_cap_hours <=> OLD.weekly_cap_hours)
        OR NOT (NEW.went_live_at <=> OLD.went_live_at) OR NOT (NEW.full_name <=> OLD.full_name) OR NOT (NEW.display_name <=> OLD.display_name)
        OR NOT (NEW.college <=> OLD.college) OR NOT (NEW.city <=> OLD.city) OR NOT (NEW.point_of_contact <=> OLD.point_of_contact)) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'only Robokalam staff can change this field';
      END IF;
    END`],
];
