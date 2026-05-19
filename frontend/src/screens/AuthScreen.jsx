import { useState } from 'react';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../store/auth.js';

export default function AuthScreen() {
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);
  const signInWithGoogle = useAuth((s) => s.signInWithGoogle);
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center font-sketch text-2xl animate-wobble">
        loading...
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="h-full w-full flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0, rotate: -1 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="scribble-card w-full max-w-md p-8 space-y-6"
      >
        <div className="text-center space-y-2">
          <motion.h1
            animate={{ rotate: [-1, 1, -1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="scribble-title text-5xl"
          >
            tiles
          </motion.h1>
          <p className="font-sketch text-xl text-ink/80">
            claim the grid. defend your pixels.
          </p>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (resp) => {
              try {
                await signInWithGoogle(resp.credential);
                navigate('/');
              } catch (e) {
                setError(e.message);
              }
            }}
            onError={() => setError('Google sign-in failed')}
            shape="pill"
            theme="filled_black"
            text="continue_with"
          />
        </div>

        {error && (
          <motion.p
            initial={{ x: -8 }}
            animate={{ x: [0, -4, 4, -2, 2, 0] }}
            className="text-center text-red-600 font-sketch"
          >
            {error}
          </motion.p>
        )}

        <p className="text-center text-sm text-ink/60 font-sketch">
          we only use your email to make a username & pull your avatar.
        </p>
      </motion.div>
    </div>
  );
}
