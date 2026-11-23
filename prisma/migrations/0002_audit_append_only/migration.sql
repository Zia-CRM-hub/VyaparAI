-- AuditEvent is append-only: block UPDATE and DELETE at the database level.
CREATE OR REPLACE FUNCTION audit_event_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditEvent rows are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_event_no_update_delete
BEFORE UPDATE OR DELETE ON "AuditEvent"
FOR EACH ROW EXECUTE FUNCTION audit_event_immutable();
