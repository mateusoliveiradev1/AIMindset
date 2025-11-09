-- Seed de super admin único
DO $$
DECLARE
    v_email TEXT := 'warface01031999@gmail.com';
    v_existing UUID;
BEGIN
    -- Verificar se já existe
    SELECT id INTO v_existing FROM public.admin_users WHERE email = v_email LIMIT 1;
    
    IF v_existing IS NULL THEN
        INSERT INTO public.admin_users (email, name, role)
        VALUES (v_email, 'Super Admin', 'super_admin');
    ELSE
        UPDATE public.admin_users
        SET role = 'super_admin', name = COALESCE(name, 'Super Admin'), updated_at = now()
        WHERE id = v_existing;
    END IF;
END $$;

-- Garantir unicidade
ALTER TABLE public.admin_users
    ADD CONSTRAINT admin_users_email_unique UNIQUE (email);