import React from 'react';

function Error({ statusCode }: { statusCode: number }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', fontFamily: 'sans-serif' }}>
            <p style={{ color: '#666' }}>
                {statusCode
                    ? `Ocorreu um erro ${statusCode} no servidor`
                    : 'Ocorreu um erro no cliente'}
            </p>
        </div>
    );
}

Error.getInitialProps = ({ res, err }: any) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
    return { statusCode };
};

export default Error;
