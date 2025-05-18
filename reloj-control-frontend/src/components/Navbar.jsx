import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const location = useLocation()

    return (
        <nav className="bg-gray-900 border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-14">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                                <path d="M12 6v6l4 2" strokeWidth="2"/>
                            </svg>
                            <span className="text-lg font-medium text-white">Reloj Control</span>
                        </Link>
                    </div>
                    
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-400 hover:text-white focus:outline-none"
                        >
                            <svg 
                                className="h-6 w-6" 
                                stroke="currentColor" 
                                fill="none" 
                                viewBox="0 0 24 24"
                            >
                                {isOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>

                    <div className="hidden md:flex items-center space-x-4">
                        <Link 
                            to="/importar" 
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150
                                ${location.pathname === '/importar' 
                                    ? 'text-white bg-gray-800' 
                                    : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
                        >
                            Importar
                        </Link>
                        <Link 
                            to="/resumen" 
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150
                                ${location.pathname === '/resumen' 
                                    ? 'text-white bg-gray-800' 
                                    : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
                        >
                            Resumen
                        </Link>
                        <Link 
                            to="/justificaciones" 
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150
                                ${location.pathname === '/justificaciones' 
                                    ? 'text-white bg-gray-800' 
                                    : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
                        >
                            Justificaciones
                        </Link>
                    </div>
                </div>

                <div 
                    className={`${isOpen ? 'max-h-48' : 'max-h-0'} md:hidden overflow-hidden transition-all duration-200 ease-in-out`}
                >
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        <Link 
                            to="/importar" 
                            className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150
                                ${location.pathname === '/importar' 
                                    ? 'text-white bg-gray-800' 
                                    : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
                            onClick={() => setIsOpen(false)}
                        >
                            Importar
                        </Link>
                        <Link 
                            to="/resumen" 
                            className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150
                                ${location.pathname === '/resumen' 
                                    ? 'text-white bg-gray-800' 
                                    : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
                            onClick={() => setIsOpen(false)}
                        >
                            Resumen
                        </Link>
                        <Link 
                            to="/justificaciones" 
                            className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150
                                ${location.pathname === '/justificaciones' 
                                    ? 'text-white bg-gray-800' 
                                    : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
                            onClick={() => setIsOpen(false)}
                        >
                            Justificaciones
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
} 