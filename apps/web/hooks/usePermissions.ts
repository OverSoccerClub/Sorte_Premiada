import { useAuth } from '@/context/auth-context';
import { useAlert } from '@/context/alert-context';
import { PERMISSION_LABELS } from '@/lib/permissions';

export function usePermissions() {
    const { user } = useAuth();
    const { showAlert } = useAlert();

    /**
     * Verifica se o usuário tem uma permissão específica
     * MASTER sempre retorna true
     */
    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        if (user.role === 'MASTER') return true;
        return user.permissions?.[permission] === true;
    };

    /**
     * Verifica se o usuário tem PELO MENOS UMA das permissões fornecidas
     */
    const hasAnyPermission = (permissions: string[]): boolean => {
        if (!user) return false;
        if (user.role === 'MASTER') return true;
        return permissions.some(p => user.permissions?.[p] === true);
    };

    /**
     * Verifica se o usuário tem TODAS as permissões fornecidas
     */
    const hasAllPermissions = (permissions: string[]): boolean => {
        if (!user) return false;
        if (user.role === 'MASTER') return true;
        return permissions.every(p => user.permissions?.[p] === true);
    };

    /**
     * Verifica se o usuário pode criar um tipo específico de usuário
     */
    const canCreateUserType = (role: string): boolean => {
        if (!user) return false;
        if (user.role === 'MASTER') return true;

        switch (role) {
            case 'CAMBISTA':
                return user.permissions?.['CREATE_CAMBISTA'] === true;
            case 'COBRADOR':
                return user.permissions?.['CREATE_COBRADOR'] === true;
            case 'ADMIN':
                return user.permissions?.['CREATE_ADMIN'] === true;
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
                return user.permissions?.['EDIT_CAMBISTA'] === true;
            case 'COBRADOR':
                return user.permissions?.['EDIT_COBRADOR'] === true;
            case 'ADMIN':
                return user.permissions?.['EDIT_ADMIN'] === true;
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
                return user.permissions?.['DELETE_CAMBISTA'] === true;
            case 'COBRADOR':
                return user.permissions?.['DELETE_COBRADOR'] === true;
            case 'ADMIN':
                return user.permissions?.['DELETE_ADMIN'] === true;
            default:
                return false;
        }
    };

    /**
     * Verifica uma permissão e exibe um alerta explicito se negado.
     * Retorna true se permitido, false se negado.
     * Útil para usar em handlers de clique: if (!guard('EDIT_USER')) return;
     */
    const guard = (permission: string, customMessage?: string): boolean => {
        if (hasPermission(permission)) return true;

        const label = PERMISSION_LABELS[permission] || permission;
        const message = customMessage || `Você não tem permissão para: ${label}.`;

        showAlert("Acesso Negado", message, "error");
        return false;
    };

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canCreateUserType,
        canEditUserType,
        canDeleteUserType,
        guard,
    };
}
