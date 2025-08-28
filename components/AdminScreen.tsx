import React, { useState, useEffect, useCallback } from 'react';
import { supabase, BUCKET_NAME, NSFW_BUCKET_NAME } from '../supabaseClient';
import type { FileObject } from '@supabase/storage-js';

interface AdminScreenProps {
  onBack: () => void;
}

const Uploader: React.FC<{ modelName: string; bucket: string; bucketDisplayName: string; onUpload: () => void; }> = ({ modelName, bucket, bucketDisplayName, onUpload }) => {
    const [files, setFiles] = useState<FileList | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFiles(e.target.files);
        setError(null);
        setMessage(null);
    };

    const handleUpload = async () => {
        if (!files || files.length === 0) {
            setError("Please select at least one file.");
            return;
        }
        setIsUploading(true);
        setError(null);
        setUploadProgress(0);

        const totalFiles = files.length;
        let uploadedCount = 0;

        for (const file of Array.from(files)) {
            const filePath = `${modelName}/${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                setError(`Error uploading ${file.name}: ${uploadError.message}`);
                setIsUploading(false);
                return;
            }
            uploadedCount++;
            setUploadProgress((uploadedCount / totalFiles) * 100);
        }

        setIsUploading(false);
        setMessage(`${totalFiles} image${totalFiles > 1 ? 's' : ''} uploaded successfully to ${bucketDisplayName}.`);
        setFiles(null);
        onUpload(); // Notify parent to refresh
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">{bucketDisplayName} Images</h3>
            <input type="file" multiple onChange={handleFileChange} className="mb-2 w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"/>
            <button onClick={handleUpload} disabled={isUploading || !files} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50">
                {isUploading ? `Uploading... ${uploadProgress.toFixed(0)}%` : 'Upload'}
            </button>
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            {message && <p className="text-green-400 text-xs mt-2">{message}</p>}
        </div>
    );
};


const AdminScreen: React.FC<AdminScreenProps> = ({ onBack }) => {
  const [models, setModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newModelName, setNewModelName] = useState('');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
      setIsLoading(true);
      const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', { limit: 1000 });
      if (error) {
          console.error("Error fetching models:", error);
      } else {
          const folderNames = data.filter(item => item.id === null).map(item => item.name);
          setModels(folderNames);
      }
      setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleCreateModel = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newModelName || models.includes(newModelName)) {
          alert("Model name already exists or is empty.");
          return;
      }
      // Creating a folder is done by uploading a placeholder file
      const placeholderFile = new File([''], '.placeholder');
      const { error } = await supabase.storage.from(BUCKET_NAME).upload(`${newModelName}/.placeholder`, placeholderFile);
      if (error) {
          alert(`Error creating model: ${error.message}`);
      } else {
          setNewModelName('');
          fetchModels();
      }
  };

  return (
    <div className="flex flex-col w-full h-full p-4 sm:p-8 bg-gray-900 text-white animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Creator Studio</h1>
        <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg text-sm">Back</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow overflow-hidden">
        {/* Model List */}
        <div className="md:col-span-1 bg-gray-800/50 p-4 rounded-xl flex flex-col">
            <h2 className="text-2xl font-semibold mb-4">Models</h2>
            <form onSubmit={handleCreateModel} className="flex gap-2 mb-4">
                <input type="text" value={newModelName} onChange={e => setNewModelName(e.target.value)} placeholder="New model name..." className="flex-grow bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 rounded-lg">+</button>
            </form>
            <div className="flex-grow overflow-y-auto">
                {isLoading ? <p>Loading models...</p> : models.map(model => (
                    <button key={model} onClick={() => setSelectedModel(model)} className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${selectedModel === model ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        {model}
                    </button>
                ))}
            </div>
        </div>
        {/* Uploader */}
        <div className="md:col-span-2 bg-gray-800/50 p-6 rounded-xl overflow-y-auto">
            {selectedModel ? (
                <div>
                    <h2 className="text-3xl font-bold mb-4">Manage <span className="text-indigo-400">{selectedModel}</span></h2>
                    <div className="space-y-6">
                       <Uploader modelName={selectedModel} bucket={BUCKET_NAME} bucketDisplayName="SFW" onUpload={fetchModels} />
                       <Uploader modelName={selectedModel} bucket={NSFW_BUCKET_NAME} bucketDisplayName="NSFW" onUpload={fetchModels} />
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-xl">Select a model to start uploading images.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminScreen;
