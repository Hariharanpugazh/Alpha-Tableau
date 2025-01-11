import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'

const DataProfiling: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file to upload.')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setError(null)

    const formData = new FormData()
    formData.append('dataset', file)

    try {
      const response = await fetch('http://localhost:8000/api/tableau/upload/', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('File upload failed.')
      }

      const text = await response.text()
      const data = JSON.parse(text.replace(/NaN/g, 'null'))

      // Simulate progress for demo purposes
      const progressInterval = setInterval(() => {
        setUploadProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prevProgress + 10
        })
      }, 200)

      // Wait for the progress to complete
      await new Promise((resolve) => setTimeout(resolve, 2200))

      clearInterval(progressInterval)
      setUploading(false)
      setUploadProgress(100)

      // Navigate to the visual page after a successful upload
      navigate('/visual')
    } catch (error) {
      console.error('Error uploading file:', error)
      setError('An error occurred while uploading the file. Please try again.')
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Data Profiling</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
            }`}
          >
            <input {...getInputProps()} />
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
            </p>
            <p className="mt-1 text-xs text-gray-500">Supported formats: CSV, XLS, XLSX</p>
          </div>
          {file && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-gray-600 flex items-center"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <span className="truncate">{file.name}</span>
            </motion.div>
          )}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border-l-4 border-red-400 p-4"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {uploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 text-center">{uploadProgress}% uploaded</p>
            </div>
          )}
          <button
            type="submit"
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              (!file || uploading) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={!file || uploading}
          >
            {uploading ? 'Uploading...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default DataProfiling

