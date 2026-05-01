import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    message: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, message: '' };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, message: error?.message || 'Unexpected runtime error.' };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('UI crash captured by ErrorBoundary:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <div className='min-h-screen bg-background text-foreground flex items-center justify-center p-6'>
                <div className='w-full max-w-lg rounded-2xl border border-border bg-card p-6'>
                    <h1 className='text-xl font-black tracking-tight'>Something went wrong</h1>
                    <p className='mt-2 text-sm text-muted-foreground'>
                        The app hit a runtime issue after navigation. Please refresh to continue.
                    </p>
                    <p className='mt-3 rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground break-all'>
                        {this.state.message}
                    </p>
                    <button
                        onClick={this.handleReload}
                        className='mt-4 btn-primary'
                    >
                        Reload
                    </button>
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
