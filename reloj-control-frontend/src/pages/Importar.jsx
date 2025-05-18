import { useState } from 'react'

export default function Importar() {
    const [file, setFile] = useState(null)
    const [msg, setMsg]   = useState('')

    const onFileChange = e => setFile(e.target.files[0])

    const onSubmit = async () => {
        if (!file) return setMsg('Selecciona un .dat')

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
        } catch (e) {
            setMsg('Error: ' + e.message)
        }
    }

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold">Importar marcas (.dat)</h1>
            <input type="file" accept=".dat" onChange={onFileChange} />
            <button
                onClick={onSubmit}
                className="block bg-blue-600 text-white px-4 py-2 rounded"
            >
                Subir e importar
            </button>
            {msg && <p>{msg}</p>}
        </div>
    )
}
