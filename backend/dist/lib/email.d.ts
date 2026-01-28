export declare const verifySMTPConnection: () => Promise<boolean>;
interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export declare const sendEmail: (options: EmailOptions) => Promise<{
    success: boolean;
    messageId: any;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    messageId?: undefined;
}>;
export declare const sendPasswordResetEmail: (email: string, username: string, resetToken: string) => Promise<{
    success: boolean;
    messageId: any;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    messageId?: undefined;
}>;
export declare const sendPasswordResetConfirmation: (email: string, username: string) => Promise<{
    success: boolean;
    messageId: any;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    messageId?: undefined;
}>;
export {};
//# sourceMappingURL=email.d.ts.map