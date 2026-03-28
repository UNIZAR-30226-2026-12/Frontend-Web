const BASE_URL = 'http://localhost:8081/api';

const getFallbackBaseUrl = (url: string): string | null => {
    if (url.includes('localhost:8081')) {
        return url.replace('localhost:8081', 'localhost:8000');
    }
    if (url.includes('localhost:8000')) {
        return url.replace('localhost:8000', 'localhost:8081');
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
                const error = await response.json();
                throw new Error(error.detail || 'Error al iniciar sesión');
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
                const error = await response.json();
                throw new Error(error.detail || 'Error al registrarse');
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
            if (!response.ok) throw new Error('Error al obtener estadísticas');
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
            if (!response.ok) throw new Error('Error al actualizar personalización');
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
    },

    // Games
    games: {
        invite: async (friendId: number, mode: string) => {
            const response = await interceptedFetch(`${BASE_URL}/games/invite`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ friend_id: friendId, mode }),
            });
            if (!response.ok) throw new Error('Error al enviar invitación');
            return response.json();
        },
    }
};
