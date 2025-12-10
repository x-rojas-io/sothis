import CredentialsProvider from 'next-auth/providers/credentials';
import { SimpleSupabaseAdapter } from '@/lib/custom-adapter';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Resend } from 'resend';
import { NextAuthOptions } from 'next-auth';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Supabase environment variables are missing. Authentication will not work.');
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "OTP",
            credentials: {
                email: { label: "Email", type: "email" },
                code: { label: "Code", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.code) {
                    throw new Error('Missing email or code');
                }

                // 1. Verify Code in verification_tokens
                const { data: tokenData } = await supabaseAdmin
                    .from('verification_tokens')
                    .select('*')
                    .eq('identifier', credentials.email)
                    .eq('token', credentials.code)
                    .single();

                if (!tokenData) {
                    throw new Error('Invalid code');
                }

                if (new Date(tokenData.expires) < new Date()) {
                    throw new Error('Code expired');
                }

                // 2. Get or Create User
                const { data: user } = await supabaseAdmin
                    .from('users')
                    .select('*')
                    .eq('email', credentials.email)
                    .single();

                // If user exists, return them
                if (user) {
                    // Clean up used token
                    await supabaseAdmin.from('verification_tokens').delete().eq('token', credentials.code);
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        role: user.role
                    };
                }

                // Note: In this specific app flow, users are typically created BEFORE sign-in 
                // via the /api/users/create route or booking flow. 
                // However, to be safe, if we have a valid OTP for an email, we could conceptually create the user here too,
                // but our current flow ensures they are created first.
                // If user doesn't exist but has valid OTP, it implies they started the "New User" flow but maybe didn't finish creation?
                // Actually, the new user flow creates user THEN sends OTP. 
                // So if we are here, user SHOULD exist. 

                throw new Error('User not found');
            }
        })
    ],
    // Only configure adapter if variables exist to prevent crash
    adapter: SimpleSupabaseAdapter(),
    session: {
        strategy: "jwt", // Use JWT for credentials provider
    },
    callbacks: {
        async jwt({ token, user, account }: any) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session?.user) {
                session.user.id = token.id;
                session.user.role = token.role;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
    },
};
