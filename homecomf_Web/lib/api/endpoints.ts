// list of backend routes
export const API = {
    AUTH: {
        REGISTER: '/api/auth/register',
        LOGIN: '/api/auth/login',
        FORGOT_PASSWORD: '/api/auth/forgot-password',
        RESET_PASSWORD: '/api/auth/reset-password',
        VERIFY: '/api/auth/verify',
        UPDATE_PROFILE: (id: string) => `/api/auth/${id}`,
        EXPORT: '/api/auth/export',
        IMPORT: '/api/auth/import',
        MFA_GENERATE: '/api/auth/mfa/generate',
        MFA_ENABLE: '/api/auth/mfa/enable',
        MFA_DISABLE: '/api/auth/mfa/disable',
        AUDIT_LOGS: '/api/auth/admin/audit-logs',
    },
    ADMIN: {
        USERS: '/api/admin/users',
        USER_BY_ID: (id: string) => `/api/admin/users/${id}`,
        HOSTS: '/api/admin/hosts',
        HOSTS_PENDING: '/api/admin/hosts/pending',
        HOST_APPROVE: (id: string) => `/api/admin/hosts/${id}/approve`,
        HOST_REJECT: (id: string) => `/api/admin/hosts/${id}/reject`,
    },
    HOST: {
        ME: '/api/host/me',
        APPLY: '/api/host/apply',
        CREATE_LISTING: '/api/host/listings',
        GET_LISTINGS: '/api/host/listings',
        GET_LISTING_BY_ID: (id: string) => `/api/host/listings/${id}`,
        UPDATE_LISTING: (id: string) => `/api/host/listings/${id}`,
        CREATE_EXPERIENCE: '/api/host/experiences',
        GET_EXPERIENCES: '/api/host/experiences',
        GET_EXPERIENCE_BY_ID: (id: string) => `/api/host/experiences/${id}`,
        UPDATE_EXPERIENCE: (id: string) => `/api/host/experiences/${id}`,
        GET_RESERVATIONS: '/api/host/reservations',
    },
    NOTIFICATIONS: {
        LIST: '/api/notifications',
        MARK_READ: (id: string) => `/api/notifications/${id}/read`,
        MARK_ALL_READ: '/api/notifications/read-all',
    },
    REPORTS: {
        CREATE: '/api/reports',
        ADMIN_LIST: '/api/reports/admin',
        ADMIN_STATUS: (id: string) => `/api/reports/admin/${id}/status`,
    },
    PUBLIC: {
        ACCOMMODATIONS: '/api/erd/accommodations',
        EXPERIENCES: '/api/erd/experiences',
    }
}