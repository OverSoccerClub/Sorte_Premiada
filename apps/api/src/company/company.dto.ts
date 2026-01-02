export interface UpdateCompanySettingsDto {
    companyName?: string;
    slogan?: string;
    logoUrl?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    primaryColor?: string;
    updateUrl?: string;
}

export interface CreateCompanyDto {
    slug: string;
    companyName: string;
    slogan?: string;
    primaryColor?: string;

    // Initial Admin User
    adminName: string;
    adminUsername: string;
    adminEmail?: string;
    adminPassword?: string; // If not provided, generate default or error? Let's make it optional and default to '123456' or similar for ease, or mandatory. Let's make it mandatory for security.
}
