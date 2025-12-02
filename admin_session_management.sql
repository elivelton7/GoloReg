-- RPC to get all open sessions with user details
CREATE OR REPLACE FUNCTION get_open_sessions()
RETURNS TABLE (
    session_id UUID,
    user_id UUID,
    username TEXT,
    email TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id AS session_id,
        s.user_id,
        COALESCE(p.username, 'Unknown') AS username,
        u.email::TEXT,
        s.inicio AS start_time,
        CEIL(EXTRACT(EPOCH FROM (timezone('utc'::text, now()) - s.inicio)) / 60)::INTEGER AS duration_minutes
    FROM
        public.usage_sessions s
    LEFT JOIN
        public.profiles p ON s.user_id = p.id
    JOIN
        auth.users u ON s.user_id = u.id
    WHERE
        s.status = 'ABERTA'
    ORDER BY
        s.inicio DESC;
END;
$$;

-- RPC to delete a session (admin only, no charge)
CREATE OR REPLACE FUNCTION delete_session(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM public.usage_sessions
    WHERE id = p_session_id;

    IF FOUND THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Session not found');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
