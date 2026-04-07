import { supabase } from "../lib/supabase";
import type { Session, UserIdentity } from "@supabase/supabase-js";

export const authApi = {
  getSession: async (): Promise<Session | null> => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);
    return session; // null if not logged in
  },

  login: async (email: string, password: string): Promise<Session | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data.session;
  },

  register: async (
    email: string,
    password: string,
    displayName: string
  ): Promise<{ session: Session | null; needsConfirmation: boolean }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName || email.split("@")[0] } },
    });
    if (error) throw new Error(error.message);
    // session is null when email confirmation is required
    return { session: data.session, needsConfirmation: !data.session };
  },

  resetPassword: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/`,
    });
    if (error) throw new Error(error.message);
  },

  updatePassword: async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },

  signInWithGoogle: async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw new Error(error.message);
  },

  signInWithFacebook: async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw new Error(error.message);
  },

  getIdentities: async (): Promise<UserIdentity[]> => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw new Error(error.message);
    return user?.identities ?? [];
  },

  linkGoogle: async (): Promise<void> => {
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw new Error(error.message);
  },

  unlinkGoogle: async (identity: UserIdentity): Promise<void> => {
    const { error } = await supabase.auth.unlinkIdentity(identity);
    if (error) throw new Error(error.message);
  },

  logout: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },
};
