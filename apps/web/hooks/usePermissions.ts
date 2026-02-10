import { useAuth } from '@/context/auth-context';

export function usePermissions() {
    const { user } = useAuth();

    /**
     * Verifica se o usuário tem uma permissão específica
     * MASTER sempre retorna true
     */
    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        if (user.role === 'MASTER') return true;
        return (user as any).permissions?.[permission] === true;
    };

    /**
     * Verifica se o usuário tem PELO MENOS UMA das permissões fornecidas
     */
    const hasAnyPermission = (permissions: string[]): boolean => {
        if (!user) return false;
        if (user.role === 'MASTER') return true;
        return permissions.some(p => (user as any).permissions?.[p] === true);
    };

    /**
     * Verifica se o usuário tem TODAS as permissões fornecidas
     */
    const hasAllPermissions = (permissions: string[]): boolean => {
        if (!user) return false;
        if (user.role === 'MASTER') return true;
        return permissions.every(p => (user as any).permissions?.[p] === true);
    };

    /**
     * Verifica se o usuário pode criar um tipo específico de usuário
     */
    const canCreateUserType = (role: string): boolean => {
        if (!user) return false;
        if (user.role === 'MASTER') return true;

        switch (role) {
            case 'CAMBISTA':
                return (user as any).permissions?.['CREATE_CAMBISTA'] === true;
            case 'COBRADOR':
                return (user as any).permissions?.['CREATE_COBRADOR'] === true;
            case 'ADMIN':
                return (user as any).permissions?.['CREATE_ADMIN'] === true;
            default:
                return false;
        }
    };

    /**
     * Verifica se o usuário pode editar um tipo específico de usuário
     */
    const canEditUserType = (role: string): boolean => {
        if (!user) return false;
        if (user.role === 'MASTER') return true;

        switch (role) {
            case 'CAMBISTA':
                return (user as any).permissions?.['EDIT_CAMBISTA'] === true;
            case 'COBRADOR':
                return (user as any).permissions?.['EDIT_COBRADOR'] === true;
            case 'ADMIN':
                return (user as any).permissions?.['EDIT_ADMIN'] === true;
            default:
                return false;
        }
    };

    /**
     * Verifica se o usuário pode excluir um tipo específico de usuário
     */
    const canDeleteUserType = (role: string): boolean => {
        if (!user) return false;
        if (user.role === 'MASTER') return true;

        switch (role) {
            case 'CAMBISTA':
                return (user as any).permissions?.['DELETE_CAMBISTA'] === true;
            case 'COBRADOR':
                return (user as any).permissions?.['DELETE_COBRADOR'] === true;
            case 'ADMIN':
                return (user as any).permissions?.['DELETE_ADMIN'] === true;
            default:
                return false;
        }
    };

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canCreateUserType,
        canEditUserType,
        canDeleteUserType,
    };
}
