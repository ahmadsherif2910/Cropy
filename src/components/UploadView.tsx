import React from 'react';
import { CloudUpload, CheckCircle2, Layers, Cpu, Settings2, LucideIcon, Folder, FileUp, Play, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UploadViewProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  onStartProcessing: (modelSrc: string | File) => void;
}

export default function UploadView({ files, setFiles, onStartProcessing }: UploadViewProps) {
  const [modelType, setModelType] = React.useState<'default' | 'custom' | 'sam3'>('default');
  const [customModel, setCustomModel] = React.useState('');
  const [customModelFile, setCustomModelFile] = React.useState<File | null>(null);
  const [showSam3Help, setShowSam3Help] = React.useState(false);

  const fileCount = files.length;
  const isStartDisabled = fileCount === 0 || (modelType === 'custom' && !customModelFile);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const handleStart = () => {
    if (modelType === 'default') {
      onStartProcessing('./best.onnx');
    } else if (modelType === 'custom' && customModelFile) {
      onStartProcessing(customModelFile);
    } else if (modelType === 'sam3') {
      onStartProcessing('sam3-external');
    }
  };

  return (
    <div className="pt-4 px-4 pb-6 md:pt-8 md:px-8 md:pb-8 flex flex-col gap-6 md:gap-8 min-h-full bg-[#F4F1EA] relative">
      <header className="flex flex-col border-b-2 border-black pb-6">
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50 mb-2">Ingestion / Data Pipeline</span>
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tighter uppercase leading-tight md:leading-[0.85]">
          Initialize your<br />
          <span className="bg-primary px-3">data pipeline</span>
        </h1>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bento-card p-6 md:p-12 justify-center items-center group min-h-[400px]">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <CloudUpload size={120} />
          </div>

          <div className="relative z-10 flex flex-col items-center w-full">
            <div className="w-16 h-16 md:w-20 md:h-20 border-2 border-black flex items-center justify-center mb-6 md:mb-8 bg-white group-hover:bg-primary transition-colors">
              <CloudUpload size={32} />
            </div>
            <h3 className="font-display text-2xl md:text-4xl font-bold uppercase tracking-tighter mb-4 text-center">Upload<br />to Begin Analysis</h3>
            <p className="text-on-surface-variant text-xs md:text-sm mb-8 md:mb-12 text-center max-w-sm font-medium">
              {fileCount > 0
                ? `${fileCount} assets staged for processing.`
                : "Upload your photos or entire folders. The local AI engine will automatically crop, align, and organize them."
              }
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <label className="brutalist-button bg-white text-black text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-stone-50">
                <FileUp size={18} />
                File Upload
                <input type="file" multiple className="hidden" onChange={handleFileChange} />
              </label>
              <label className="brutalist-button bg-white text-black text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-stone-50">
                <Folder size={18} />
                Folder Upload
                <input
                  type="file"
                  multiple
                  // @ts-ignore
                  webkitdirectory=""
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <section className="bento-card flex-1 min-h-[300px]">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-bold uppercase tracking-widest">Model Configuration</span>
              <Settings2 size={16} />
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setModelType('default')}
                className={`w-full p-4 border-2 flex items-center justify-between transition-all ${modelType === 'default' ? 'bg-primary border-black shadow-[4px_4px_0_0_#000000]' : 'bg-white border-black/20 opacity-60'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black flex items-center justify-center text-primary">
                    <Cpu size={18} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider">Cropy Default Engine</span>
                </div>
                {modelType === 'default' && <CheckCircle2 size={16} />}
              </button>

              <button
                onClick={() => setModelType('custom')}
                className={`w-full p-4 border-2 flex flex-col transition-all ${modelType === 'custom' ? 'bg-white border-black shadow-[4px_4px_0_0_#000000]' : 'bg-white border-black/20 opacity-60'
                  }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black flex items-center justify-center text-white">
                      <Settings2 size={18} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider">User Defined Model</span>
                  </div>
                  {modelType === 'custom' && <CheckCircle2 size={16} />}
                </div>

                {modelType === 'custom' && (
                  <div className="mt-4 w-full relative" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="file"
                      id="model-upload"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setCustomModel(e.target.files[0].name);
                          setCustomModelFile(e.target.files[0]);
                        }
                      }}
                    />
                    <label
                      htmlFor="model-upload"
                      className="w-full p-3 bg-stone-100 border-2 border-black flex items-center justify-between cursor-pointer hover:bg-stone-200 transition-colors"
                    >
                      <span className="font-mono text-[10px] uppercase font-bold text-black/60 truncate mr-2">
                        {customModel || "Upload model file..."}
                      </span>
                      <FileUp size={14} />
                    </label>
                  </div>
                )}
              </button>

              <button
                onClick={() => setModelType('sam3')}
                className={`w-full p-4 border-2 flex flex-col transition-all ${modelType === 'sam3' ? 'bg-white border-black shadow-[4px_4px_0_0_#000000]' : 'bg-white border-black/20 opacity-60'
                  }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black flex items-center justify-center text-primary">
                      <Terminal size={18} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-left">SAM 3 (Local)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {modelType === 'sam3' && <CheckCircle2 size={16} />}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSam3Help(!showSam3Help);
                      }}
                      className="w-5 h-5 rounded-full border border-black flex items-center justify-center text-[10px] font-bold bg-stone-200 hover:bg-stone-300 relative transition-colors"
                    >
                      ?
                      {showSam3Help && (
                        <div 
                          className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-white border-2 border-black text-black text-[10px] normal-case font-sans z-[100] shadow-[4px_4px_0_0_#000000] leading-relaxed cursor-auto text-left"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Go to <a href="https://huggingface.co/facebook/sam3" target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800">https://huggingface.co/facebook/sam3</a>. You must first request access for the model weights on the SAM 3 model page on Hugging Face and then, once approved, download sam3.pt from that page. Place the downloaded sam3.pt file in your working directory or specify the full path when loading the model.
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {modelType === 'sam3' && (
                  <div className="mt-4 w-full relative text-left" onClick={(e) => e.stopPropagation()}>
                    <div className="p-3 bg-stone-100 border-2 border-black flex flex-col gap-2 cursor-default">
                      <span className="font-mono text-[10px] uppercase font-bold text-black/60 leading-tight">
                        1. Download <a href="./autocrop_sam3.py" download className="text-blue-600 underline hover:text-blue-800">autocrop_sam3.py</a>
                      </span>
                      <span className="font-mono text-[10px] uppercase font-bold text-black/60 leading-tight">
                        2. Run it locally with your model.
                      </span>
                      <span className="font-mono text-[10px] uppercase font-bold text-black/60 leading-tight">
                        3. Upload the cropped images.
                      </span>
                    </div>
                  </div>
                )}
              </button>
            </div>

            <div className="mt-auto pt-8 border-t border-black/10 flex justify-between text-[10px] font-mono opacity-50">
              <span>LATENCY: {modelType === 'default' ? '12MS' : '45MS'}</span>
              <span>VER: 2.4.0</span>
            </div>
          </section>
        </div>
      </div>

      <div className="flex justify-center sticky bottom-6 md:bottom-8 z-50 pointer-events-none">
        <AnimatePresence>
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={isStartDisabled ? {} : { scale: 1.05, y: -4 }}
            whileTap={isStartDisabled ? {} : { scale: 0.95 }}
            onClick={handleStart}
            disabled={isStartDisabled}
            className={`brutalist-button text-white flex items-center gap-4 text-lg border-4 whitespace-nowrap min-w-[280px] md:min-w-0 pointer-events-auto ${
              isStartDisabled 
                ? 'bg-stone-500 border-stone-600 opacity-50 cursor-not-allowed grayscale' 
                : 'bg-black border-primary shadow-[8px_8px_0_0_#E0FF62]'
            }`}
          >
            <div className="w-10 h-10 bg-primary flex items-center justify-center text-black">
              <Play size={24} fill="currentColor" />
            </div>
            <span className="mr-4">Start Processing</span>
          </motion.button>
        </AnimatePresence>
      </div>
    </div>
  );
}

interface ModuleItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
}

function ModuleItem({ icon: Icon, label, active }: ModuleItemProps) {
  return (
    <div className={`p-4 border-2 flex items-center justify-between transition-colors ${active ? 'bg-white border-black' : 'border-transparent opacity-30 grayscale'}`}>
      <div className="flex items-center gap-3">
        <Icon size={18} />
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      {active && <CheckCircle2 size={16} className="text-black" />}
    </div>
  );
}