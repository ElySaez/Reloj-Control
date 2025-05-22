import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// En un futuro, podrías tener un contexto o servicio de autenticación
// import { useAuth } from '../context/AuthContext'; 

// Función para decodificar JWT (simplificada, no verifica firma)
function decodeJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error decoding JWT:", e);
        return null;
    }
}

export default function LoginPage() {
    const [run, setRun] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    // const { login } = useAuth(); // Si usaras un AuthContext

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', { // Usando el proxy de Vite
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ run, password }),
            });

            // Primero verificar si la respuesta fue exitosa
            if (!response.ok) {
                // Si no es OK (ej. 401, 403, 500), mostrar mensaje genérico.
                // El backend podría no devolver JSON en estos casos.
                setError('Error de autenticación. Verifique sus credenciales e intente de nuevo.');
                // Opcionalmente, podrías intentar leer response.text() para un mensaje más específico si lo hubiera:
                // const errorText = await response.text();
                // setError(errorText || 'Error de autenticación. Verifique sus credenciales e intente de nuevo.');
                throw new Error('Authentication failed'); // Lanzar error para detener el flujo normal
            }

            // Si la respuesta es OK, entonces sí esperamos JSON
            const data = await response.json(); 

            if (data.token) {
                localStorage.setItem('token', data.token);
                
                const decodedToken = decodeJwt(data.token);
                if (decodedToken) {
                    localStorage.setItem('run', decodedToken.sub);
                    
                    let roleToStore = 'USER'; // Fallback por defecto

                    if (decodedToken.rol) { // Opción 1: El rol está directamente en el campo 'rol'
                        roleToStore = decodedToken.rol;
                    } else if (decodedToken.roles && decodedToken.roles.length > 0) { // Opción 2: El rol está en el campo 'roles' (array)
                        const firstRole = decodedToken.roles[0];
                        if (typeof firstRole === 'string') {
                            roleToStore = firstRole; // Ejemplo: roles: ["ROLE_USER", ...]
                        } else if (typeof firstRole === 'object' && firstRole !== null && firstRole.authority) {
                            roleToStore = firstRole.authority; // Ejemplo: roles: [{ "authority": "ROLE_USER" }, ...]
                        }
                    } else if (decodedToken.authorities && decodedToken.authorities.length > 0) { // Opción 3: El rol está en el campo 'authorities' (array)
                        const firstAuthority = decodedToken.authorities[0];
                        if (typeof firstAuthority === 'string') {
                            roleToStore = firstAuthority; // Ejemplo: authorities: ["ROLE_USER", ...]
                        } else if (typeof firstAuthority === 'object' && firstAuthority !== null && firstAuthority.authority) {
                            roleToStore = firstAuthority.authority; // Ejemplo: authorities: [{ "authority": "ROLE_USER" }, ...]
                        }
                    }

                    localStorage.setItem('userRole', roleToStore);
                    console.log("Token decodificado:", decodedToken);
                    console.log("RUN guardado:", decodedToken.sub);
                    console.log("Rol guardado en localStorage CORRECTO:", roleToStore);
                } else {
                    // No se pudo decodificar el token, maneja el error o limpia el token guardado
                    localStorage.removeItem('token');
                    throw new Error('No se pudo procesar la información del usuario desde el token.');
                }
                
                // await login(data.token); // Si usaras AuthContext
                navigate('/'); // Redirige a Home después del login
            } else {
                throw new Error(data.message || 'No se recibió token.');
            }

        } catch (err) {
            // Si ya se estableció un mensaje de error específico (como el de !response.ok),
            // no lo sobrescribas con el mensaje genérico de la excepción.
            if (!error) {
                setError(err.message || 'Ocurrió un error inesperado.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Iniciar Sesión
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <input type="hidden" name="remember" defaultValue="true" />
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="run" className="sr-only">
                                RUN
                            </label>
                            <input
                                id="run"
                                name="run"
                                type="text"
                                autoComplete="username" // Opcional, para gestores de contraseñas
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="RUN (Ej: 12345678)"
                                value={run}
                                onChange={(e) => setRun(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="passwordln" className="sr-only"> {/* ID único para el label y input */}
                                Contraseña
                            </label>
                            <input
                                id="passwordln" 
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Ingresando...
                                </>
                            ) : (
                                'Ingresar'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 