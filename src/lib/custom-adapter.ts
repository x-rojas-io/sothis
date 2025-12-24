
import { supabaseAdmin } from './supabase-admin';
import { Adapter } from 'next-auth/adapters';

export function SimpleSupabaseAdapter(): Adapter {
    return {
        async createUser(user: any) {
            const { emailVerified, id, ...rest } = user;

            // Explicitly map fields to avoid inserting unknown columns
            const newUser = {
                email: rest.email,
                name: rest.name,
                image: rest.image,
                email_verified: emailVerified,
                role: 'client'
            };

            const { data, error } = await supabaseAdmin
                .from('users')
                .insert(newUser)
                .select()
                .single();

            if (error) {
                console.error('ADAPTER: createUser ERROR:', error);
                throw error;
            }
            return { ...data, emailVerified: data.email_verified };
        },
        async getUser(id) {
            const { data, error } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('id', id)
                .single();
            if (error) return null;
            return { ...data, emailVerified: data.email_verified };
        },
        async getUserByEmail(email) {
            const { data, error } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('email', email)
                .single();
            if (error) return null;
            return { ...data, emailVerified: data.email_verified };
        },
        async getUserByAccount({ provider, providerAccountId }) {
            const { data, error } = await supabaseAdmin
                .from('accounts')
                .select('users (*)')
                .eq('provider', provider)
                .eq('providerAccountId', providerAccountId)
                .single();
            if (error || !data) return null;
            const user = data.users as any;
            return { ...user, emailVerified: user.email_verified };
        },
        async updateUser(user) {
            const { emailVerified, ...rest } = user;
            // Explicitly only allow known columns to prevent PGRST204 if extra props exist
            const updates: any = {
                name: rest.name,
                email: rest.email,
                image: rest.image,
                role: (rest as any).role,
                email_verified: emailVerified,
            };
            // Remove undefined keys
            Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

            const { data, error } = await supabaseAdmin
                .from('users')
                .update(updates)
                .eq('id', user.id)
                .select()
                .single();
            if (error) {
                console.error('ADAPTER: updateUser ERROR:', error);
                throw error;
            }
            return {
                ...data,
                emailVerified: data.email_verified ? new Date(data.email_verified) : null
            };
        },
        async deleteUser(userId) {
            await supabaseAdmin.from('users').delete().eq('id', userId);
        },
        async linkAccount(account: any) {
            const mappedAccount = {
                ...account,
                userid: account.userId,
                provideraccountid: account.providerAccountId,
            };
            delete mappedAccount.userId;
            delete mappedAccount.providerAccountId;

            const { error } = await supabaseAdmin.from('accounts').insert(mappedAccount);
            if (error) throw error;
            return account;
        },
        async unlinkAccount({ provider, providerAccountId }) {
            await supabaseAdmin.from('accounts').delete().match({ provider, provideraccountid: providerAccountId });
        },
        // Session management
        async createSession({ sessionToken, userId, expires }) {
            const { data, error } = await supabaseAdmin
                .from('sessions')
                .insert({
                    sessiontoken: sessionToken,
                    userid: userId,
                    expires
                })
                .select()
                .single();
            if (error) throw error;
            return {
                ...data,
                sessionToken: data.sessiontoken,
                userId: data.userid,
                expires: new Date(data.expires)
            };
        },
        async getSessionAndUser(sessionToken) {
            const { data, error } = await supabaseAdmin
                .from('sessions')
                .select('*, users(*)')
                .eq('sessiontoken', sessionToken)
                .single();
            if (error || !data) return null;
            const { users, ...session } = data;
            return {
                session: {
                    ...session,
                    sessionToken: session.sessiontoken,
                    userId: session.userid,
                    expires: new Date(session.expires)
                },
                user: {
                    ...users,
                    emailVerified: users.email_verified ? new Date(users.email_verified) : null
                } as any,
            };
        },
        async updateSession(session) {
            const updates: any = {};
            if (session.expires) updates.expires = session.expires;
            if (session.userId) updates.userid = session.userId;

            const { data, error } = await supabaseAdmin
                .from('sessions')
                .update(updates)
                .eq('sessiontoken', session.sessionToken)
                .select()
                .single();
            if (error) return null;
            return {
                ...data,
                sessionToken: data.sessiontoken,
                userId: data.userid,
                expires: new Date(data.expires)
            };
        },
        async deleteSession(sessionToken) {
            await supabaseAdmin.from('sessions').delete().eq('sessiontoken', sessionToken);
        },
        // Verification tokens for Magic Link
        async createVerificationToken(token) {
            const { data, error } = await supabaseAdmin
                .from('verification_tokens')
                .insert(token)
                .select()
                .single();
            if (error) {
                console.error('ADAPTER: createVerificationToken ERROR:', error);
                throw error;
            }
            return {
                ...data,
                expires: new Date(data.expires)
            };
        },
        async useVerificationToken({ identifier, token }) {
            const { data, error } = await supabaseAdmin
                .from('verification_tokens')
                .delete()
                .match({ identifier, token })
                .select()
                .single();
            if (error) {
                return null;
            }
            return {
                ...data,
                expires: new Date(data.expires)
            };
        },
    };
}
