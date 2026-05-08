import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 1. Importe o QueryClient e o Provider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 2. Crie a instância do client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Opcional: evita fazer refetch toda vez que o usuário volta para a aba
      retry: 1, // Opcional: número de tentativas caso uma requisição falhe
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 3. Envolva o App com o Provider */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);