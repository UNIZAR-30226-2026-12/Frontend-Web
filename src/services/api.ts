const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
const port = typeof window !== 'undefined' ? window.location.port : '';

// BASE_URL relativo para que Nginx actúe como proxy inverso
export const API_BASE_URL = '/api';
const BASE_URL = API_BASE_URL;

// Lógica de WebSockets autodetectada según el protocolo actual
const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
const portSuffix = port ? `:${port}` : '';
export const WS_BASE_URL = `${wsProtocol}//${hostname}${portSuffix}`;

const getFallbackBaseUrl = (url: string): string | null => {
    if (url.includes(':8081')) {
        return url.replace(':8081', ':8000');
    }
    if (url.includes(':8000')) {
        return url.replace(':8000', ':8081');
    }
    return null;
};

const getHeaders = () => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const interceptedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let bodyLog = '';
    if (options.body && typeof options.body === 'string') {
        try {
            if (options.body.trim().startsWith('{') || options.body.trim().startsWith('[')) {
                bodyLog = JSON.parse(options.body);
            } else {
                bodyLog = options.body;
            }
        } catch (e) {
            bodyLog = options.body;
        }
    }
    console.log(`[API] Request: ${options.method || 'GET'} ${url}`, bodyLog);
    try {
        const response = await fetch(url, options);
        console.log(`[API] Response: ${response.status} ${url}`);
        return response;
    } catch (err) {
        const fallbackUrl = getFallbackBaseUrl(url);
        if (!fallbackUrl) throw err;

        console.warn(`[API] Request failed on ${url}. Retrying with ${fallbackUrl}`);
        const fallbackResponse = await fetch(fallbackUrl, options);
        console.log(`[API] Response: ${fallbackResponse.status} ${fallbackUrl}`);
        return fallbackResponse;
    }
};

export const api = {
    // Auth
    auth: {
        login: async (formData: URLSearchParams) => {
            const response = await interceptedFetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });
            if (!response.ok) {
                let detail = 'Error al iniciar sesión';
                try {
                    const error = await response.json();
                    detail = error.detail || detail;
                } catch {
                    // Respuesta sin JSON (p.ej. 404 de Nginx)
                }
                throw new Error(detail);
            }
            return response.json();
        },
        forgotPassword: async (email: string) => {
            const response = await interceptedFetch(`${BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
            if (!response.ok) {
                let detail = 'Error al solicitar recuperación';
                try {
                    const error = await response.json();
                    detail = error.detail || detail;
                } catch {
                    // Respuesta sin JSON
                }
                // 404 = email no existe → error real para el usuario
                if (response.status === 404) {
                    throw new Error(detail);
                }
                // Otros errores (500 = email existe pero fallo al enviar correo) → no bloquear
                return { message: detail };
            }
            return response.json();
        },
        register: async (userData: any) => {
            const response = await interceptedFetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });
            if (!response.ok) {
                let detail = 'Error al registrarse';
                try {
                    const error = await response.json();
                    detail = error.detail || detail;
                } catch {
                    // Respuesta sin JSON (p.ej. 404 de Nginx)
                }
                throw new Error(detail);
            }
            return response.json();
        },
    },

    // Users
    users: {
        getMe: async () => {
            const response = await interceptedFetch(`${BASE_URL}/users/me`, {
                headers: getHeaders(),
            });
            if (!response.ok) throw new Error('Error al obtener perfil');
            return response.json();
        },
        getStats: async (userId: number | 'me') => {
            const response = await interceptedFetch(`${BASE_URL}/users/${userId}/stats`, {
                headers: getHeaders(),
            });
            if (!response.ok) throw new Error('Error al obtener estadÃ­sticas');
            return response.json();
        },
        getH2H: async (userId: number) => {
            const response = await interceptedFetch(`${BASE_URL}/users/${userId}/h2h`, {
                headers: getHeaders(),
            });
            if (!response.ok) throw new Error('Error al obtener H2H');
            return response.json();
        },
        updateMe: async (updates: {
            username?: string;
            email?: string;
            current_password?: string;
            new_password?: string;
        }) => {
            const response = await interceptedFetch(`${BASE_URL}/users/me`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(updates),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Error al actualizar perfil');
            }
            return response.json();
        },
        updateCustomization: async (customization: {
            avatar_url?: string;
            preferred_piece_color?: string;
            preferred_board_color?: string;
        }) => {
            const response = await interceptedFetch(`${BASE_URL}/users/customization`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(customization),
            });
            if (!response.ok) throw new Error('Error al actualizar personalizaciÃ³n');
            return response.json();
        },
        updateElo: async (elo: number) => {
            const response = await interceptedFetch(`${BASE_URL}/users/me/elo`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ elo }),
            });
            if (!response.ok) throw new Error('Error al actualizar RR');
            return response.json();
        },
        getHistory: async (userId: number | 'me' = 'me') => {
            const endpoint = userId === 'me' ? '/users/me/history' : `/users/${userId}/history`;
            const response = await interceptedFetch(`${BASE_URL}${endpoint}`, {
                headers: getHeaders(),
            });
            if (!response.ok) throw new Error('Error al obtener historial');
            return response.json();
        },
        saveHistory: async (entry: {
            opponent_name: string;
            mode: string;
            result: 'Ganada' | 'Perdida' | 'Empate';
            score: string;
            rankChange: string;
            player_color?: 'black' | 'white';
        }) => {
            const response = await interceptedFetch(`${BASE_URL}/users/me/history`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(entry),
            });
            if (!response.ok) throw new Error('Error al guardar historial');
            return response.json();
        },
        uploadAvatar: async (formData: FormData) => {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await interceptedFetch(`${BASE_URL}/users/avatar`, {
                method: 'POST',
                headers,
                body: formData,
            });
            if (!response.ok) throw new Error('Error al subir avatar');
            return response.json();
        },
    },

    // Ranking
    ranking: {
        getGlobal: async (limit: number = 50, skip: number = 0) => {
            const response = await interceptedFetch(`${BASE_URL}/ranking?limit=${limit}&skip=${skip}`, {
                headers: getHeaders(),
            });
            if (!response.ok) throw new Error('Error al obtener ranking global');
            return response.json();
        },
    },

    // Friends
    friends: {
        list: async () => {
            const response = await interceptedFetch(`${BASE_URL}/friends`, {
                headers: getHeaders(),
            });
            if (!response.ok) throw new Error('Error al listar amigos');
            return response.json();
        },
        sendRequest: async (username: string) => {
            const response = await interceptedFetch(`${BASE_URL}/friends/request`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ username }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Error al enviar solicitud');
            }
            return response.json();
        },
        acceptRequest: async (userId: number) => {
            const response = await interceptedFetch(`${BASE_URL}/friends/${userId}/accept`, {
                method: 'POST',
                headers: getHeaders(),
            });
            if (!response.ok) throw new Error('Error al aceptar solicitud');
            return response.json();
        },
        rejectRequest: async (userId: number) => {
            const response = await interceptedFetch(`${BASE_URL}/friends/${userId}/reject`, {
                method: 'POST',
                headers: getHeaders(),
            });
            if (!response.ok) throw new Error('Error al rechazar solicitud');
            return response.json();
        },
        remove: async (userId: number) => {
            const response = await interceptedFetch(`${BASE_URL}/friends/${userId}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            if (!response.ok) throw new Error('Error al eliminar amigo');
            return response.json();
        },
        getChat: async (userId: number) => {
            const response = await interceptedFetch(`${BASE_URL}/friends/${userId}/chat`, {
                headers: getHeaders(),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Error al obtener chat');
            }
            return response.json();
        },
        sendChatMessage: async (userId: number, message: string) => {
            const response = await interceptedFetch(`${BASE_URL}/friends/${userId}/chat`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ message }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Error al enviar mensaje');
            }
            return response.json();
        },
        markChatRead: async (userId: number) => {
            const response = await interceptedFetch(`${BASE_URL}/friends/${userId}/chat/read`, {
                method: 'POST',
                headers: getHeaders(),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Error al marcar mensajes como leidos');
            }
            return response.json();
        },
    },
    // Games
    games: {
        invite: async (friendIds: number[], mode: string) => {
            const response = await interceptedFetch(`${BASE_URL}/games/invite`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ friend_ids: friendIds, mode }),
            });
            if (!response.ok) throw new Error('Error al enviar invitación');
            return response.json();
        },
        acceptInvite: async (gameId: number | string) => {
            const response = await interceptedFetch(`${BASE_URL}/games/${gameId}/accept`, {
                method: 'POST',
                headers: getHeaders(),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Error al aceptar invitación');
            }
            return response.json();
        },
        rejectInvite: async (gameId: number | string) => {
            const response = await interceptedFetch(`${BASE_URL}/games/${gameId}/reject`, {
                method: 'POST',
                headers: getHeaders(),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Error al rechazar invitación');
            }
            return response.json();
        },
        leaveLobby: async (gameId: number | string) => {
            const response = await interceptedFetch(`${BASE_URL}/games/${gameId}/leave`, {
                method: 'POST',
                headers: getHeaders(),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Error al abandonar sala');
            }
            return response.json();
        },
        getLobbyState: async (gameId: number | string) => {
            const response = await interceptedFetch(`${BASE_URL}/games/${gameId}/state`, {
                headers: getHeaders(),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Error al obtener estado de sala');
            }
            return response.json();
        },
        setReady: async (gameId: number | string, ready: boolean) => {
            const response = await interceptedFetch(`${BASE_URL}/games/${gameId}/ready`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ ready }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Error al actualizar estado de listo');
            }
            return response.json();
        },
        getPublic: async () => {
            const response = await interceptedFetch(`${BASE_URL}/games/public`, {
                headers: getHeaders(),
            });
            if (!response.ok) throw new Error('Error al obtener partidas públicas');
            return response.json();
        },
        create: async (mode: string) => {
            const response = await interceptedFetch(`${BASE_URL}/games/create`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ mode }),
            });
            if (!response.ok) throw new Error('Error al crear partida');
            return response.json();
        },
        join: async (gameId: number | string) => {
            const response = await interceptedFetch(`${BASE_URL}/games/join/${gameId}`, {
                method: 'POST',
                headers: getHeaders(),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Error al unirse a la partida');
            }
            return response.json();
        },
    }
};


