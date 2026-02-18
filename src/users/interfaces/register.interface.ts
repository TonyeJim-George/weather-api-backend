import { CustomerProfile } from "src/customers/customer-profile.entity";

export interface SafeUser {
    id: string;
    email: string;
    isActive: boolean;
    createdAt: Date;
}

export interface RegisterResponse {
    message: string;
    user: SafeUser;
    profile: {
        id: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
    };

}