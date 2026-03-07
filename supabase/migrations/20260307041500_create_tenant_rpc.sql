-- Función para permitir que un usuario autenticado cree un nuevo "Tenant" (Empresa)
-- y se asigne a sí mismo como 'owner'. Se ejecuta con SECURITY DEFINER 
-- para elevar temporalmente los privilegios sobre RLS durante la transacción.

CREATE OR REPLACE FUNCTION public.create_new_tenant(company_name TEXT)
RETURNS UUID AS $$
DECLARE
    new_tenant_id UUID;
    current_user_id UUID;
BEGIN
    -- Obtener el usuario autenticado desde el contexto de Supabase JWT
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado no puede crear una empresa.';
    END IF;

    -- Insertar el nuevo tenant
    INSERT INTO public.tenants (name)
    VALUES (company_name)
    RETURNING id INTO new_tenant_id;

    -- Asignar el rol al usuario que la creó
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (current_user_id, new_tenant_id, 'owner');

    RETURN new_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
