declare module 'nodemailer' {
  export interface Transporter {
    sendMail(mailOptions: any, callback?: (error: Error | null, info: any) => void): Promise<any>;
    verify(callback?: (error: Error | null, success: boolean) => void): Promise<boolean>;
  }

  export interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
    tls?: {
      rejectUnauthorized?: boolean;
    };
  }

  export function createTransport(options: TransportOptions): Transporter;
}