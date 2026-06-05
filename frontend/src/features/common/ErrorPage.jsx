import React from 'react'
import { useRouteError, Link } from 'react-router-dom'

export default function ErrorPage() {
    const error = useRouteError()
    console.error('Route error:', error)

    return (
        <main className='error-page' style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Something went wrong</h1>
            <p style={{ color: '#7d8590' }}>{error?.status ? `${error.status} ${error.statusText || ''}` : 'An unexpected error occurred.'}</p>
            {error?.message && (
                <pre style={{ whiteSpace: 'pre-wrap', textAlign: 'left', margin: '1rem auto', maxWidth: 800 }}>{error.message}</pre>
            )}
            <div style={{ marginTop: '1rem' }}>
                <Link to="/" style={{ color: '#ff00c3', textDecoration: 'underline' }}>
                    Return home
                </Link>
            </div>
        </main>
    )
}
