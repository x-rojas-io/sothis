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
                // ... (existing code, just adding logs at trace points)

                if (!credentials?.email || !credentials?.code) {
                    throw new Error('Missing email or code');
                }

                // ... (code verification logic) ...

                // 1. Verify Code in verification_tokens
                const { data: dbToken } = await supabaseAdmin
                    .from('verification_tokens')
                    .select('*')
                    .eq('identifier', credentials.email)
                    .eq('token', credentials.code)
                    .single();

                if (!dbToken) {
                    throw new Error('Invalid code');
                }

                if (new Date(dbToken.expires) < new Date()) {
                    await supabaseAdmin.from('verification_tokens').delete().eq('id', dbToken.id);
                    throw new Error('Code expired');
                }

                // 2. Get User
                const { data: user } = await supabaseAdmin
                    .from('users')
                    .select('*')
                    .eq('email', credentials.email)
                    .single();

                if (user) {
                    await supabaseAdmin.from('verification_tokens').delete().eq('token', credentials.code);
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        role: user.role
                    };
                }

                // ... (client check) ...
                const { data: client } = await supabaseAdmin
                    .from('clients')
                    .select('*')
                    .eq('email', credentials.email)
                    .single();

                if (client) {
                    await supabaseAdmin.from('verification_tokens').delete().eq('token', credentials.code);
                    return {
                        id: client.id,
                        email: client.email,
                        name: client.name,
                        image: client.image,
                        role: 'client'
                    };
                }

                throw new Error('User not found');
            }
        })
    ],
    adapter: SimpleSupabaseAdapter(),
    session: {
        strategy: "jwt",
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
