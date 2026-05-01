import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const message = searchParams.get('message');

        if (accessToken && refreshToken) {
            if (window.opener) {
                // Send message to opener window and close
                window.opener.postMessage({ type: 'AUTH_SUCCESS', accessToken, refreshToken }, window.location.origin);
                setTimeout(() => window.close(), 500);
            } else {
                // Not a popup, store tokens and redirect to home with a full reload to refresh AuthContext
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                window.location.href = '/';
            }
        } else if (message) {
            if (window.opener) {
                window.opener.postMessage({ type: 'AUTH_ERROR', message }, window.location.origin);
                window.close();
            } else {
                navigate(`/login?error=${encodeURIComponent(message)}`);
            }
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div className='min-h-screen flex items-center justify-center bg-background'>
            <div className='text-center'>
                <Loader2 className='w-12 h-12 text-primary animate-spin mx-auto mb-4' />
                <h2 className='text-2xl font-bold text-foreground'>Completing login...</h2>
                <p className='text-muted-foreground mt-2'>Please wait while we set up your session.</p>
            </div>
        </div>
    );
};

export default AuthCallback;
