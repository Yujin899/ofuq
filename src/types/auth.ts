export interface AuthUser {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    role?: "admin" | "student";
}

export interface AuthState {
    user: AuthUser | null;
    loading: boolean;
    error: Error | null;
}

export interface AuthContextType extends AuthState {
    signInWithGoogle: () => Promise<void>;
    signUpWithEmail: (email: string, password: string) => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}
