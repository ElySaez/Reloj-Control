import { useState } from 'react'

export default function Importar() {
    const [file, setFile] = useState(null)
    const [msg, setMsg] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [dragActive, setDragActive] = useState(false)

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        
        const files = e.dataTransfer.files
        if (files?.[0]?.name.endsWith('.dat')) {
            setFile(files[0])
            setMsg('')
        } else {
            setMsg('Por favor, selecciona un archivo .dat válido')
        }
    }

    const onFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile) {
            setFile(selectedFile)
            setMsg('')
        }
    }

    const onSubmit = async () => {
        if (!file) {
            setMsg('Por favor, selecciona un archivo .dat')
            return
        }

        setIsLoading(true)
        const form = new FormData()
        form.append('file', file)

        try {
            const res = await fetch('/api/importar', {
                method: 'POST',
                body: form
            })
            const text = await res.text()
            if (!res.ok) throw new Error(text)
            setMsg(text)
            setFile(null) // Reset file after successful upload
        } catch (e) {
            setMsg('Error: ' + e.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="card shadow-sm">
                        <div className="card-body p-4">
                            <h1 className="h3 mb-4 text-center">Importar Marcas</h1>
                            
                            <div 
                                className={`drop-zone mb-4 p-5 text-center border-2 rounded-3 ${dragActive ? 'bg-light border-primary' : 'border-dashed border-secondary'}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="mb-3">
                                    <svg className="mx-auto mb-3" width="50" height="50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                                    </svg>
                                    <p className="mb-1">Arrastra y suelta tu archivo .dat aquí</p>
                                    <p className="text-muted small">o</p>
                                </div>
                                
                                <div className="position-relative">
                                    <input
                                        type="file"
                                        accept=".dat"
                                        onChange={onFileChange}
                                        className="position-absolute top-0 start-0 opacity-0 w-100 h-100"
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <button className="btn btn-outline-primary px-4">
                                        Seleccionar archivo
                                    </button>
                                </div>
                            </div>

                            {file && (
                                <div className="alert alert-info d-flex align-items-center mb-4">
                                    <svg className="me-2" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                    </svg>
                                    <span>{file.name}</span>
                                </div>
                            )}

                            <button
                                onClick={onSubmit}
                                disabled={!file || isLoading}
                                className="btn btn-primary w-100"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Importando...
                                    </>
                                ) : 'Importar archivo'}
                            </button>

                            {msg && (
                                <div className={`alert ${msg.startsWith('Error') ? 'alert-danger' : 'alert-success'} mt-3`}>
                                    {msg}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
