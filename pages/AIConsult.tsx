import React, { useRef, useState } from 'react';
import { analyzeCustomerFace } from '../services/geminiService';
import { DB } from '../services/db';
import { useTranslation } from '../services/i18n';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';
import { Customer, Appointment, AppointmentStatus } from '../types';

const AIConsult: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedRec, setSelectedRec] = useState<any>(null);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '' });

  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const startCamera = async () => {
    setIsCameraOpen(true);
    setCapturedImage(null);
    setAnalysisResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setIsCameraOpen(false);
      showToast("Camera access required for the Magic Mirror experience.", "error");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        setIsCameraOpen(false);
        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        
        // Auto-run analysis for smoother UX
        runAnalysis(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = reader.result as string;
        setCapturedImage(img);
        setAnalysisResult(null);
        runAnalysis(img);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async (imgData: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeCustomerFace(imgData);
      setAnalysisResult(result);
      
      DB.saveAIConsultation({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        image: imgData,
        result: result
      });
      
    } catch (error) {
      showToast("Analysis failed. Try again.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBookClick = (rec: any) => {
    setSelectedRec(rec);
    setCustomerForm({ name: '', phone: '' });
    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = () => {
    if (!customerForm.name || !customerForm.phone) {
        showToast("Please enter Name and Phone to proceed.", "error");
        return;
    }

    let customer = DB.getCustomers().find(c => c.phone === customerForm.phone);
    let customerId = customer?.id;

    if (!customer) {
        const newCust: Customer = {
            id: Date.now().toString(),
            name: customerForm.name,
            phone: customerForm.phone,
            totalVisits: 0,
            loyaltyPoints: 0,
            photo: capturedImage || undefined
        };
        DB.saveCustomer(newCust);
        customerId = newCust.id;
    }

    const services = DB.getServices();
    const matchedService = services.find(s => 
        s.name.toLowerCase().includes(selectedRec.service.toLowerCase()) || 
        selectedRec.service.toLowerCase().includes(s.name.toLowerCase())
    );

    const serviceId = matchedService ? matchedService.id : services[0]?.id;
    const notes = matchedService 
        ? `AI Recommendation: ${selectedRec.reason}` 
        : `AI Recommended: ${selectedRec.service}. Reason: ${selectedRec.reason}`;

    if (!serviceId) {
        showToast("No services available to book.", "error");
        return;
    }

    const newAppt: Appointment = {
        id: Date.now().toString(),
        customerId: customerId!,
        staffId: DB.getStaff().filter(s => s.status === 'active')[0]?.id || '1', 
        serviceId: serviceId,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}),
        status: AppointmentStatus.SCHEDULED,
        notes: notes
    };

    DB.saveAppointment(newAppt);
    setIsBookingModalOpen(false);
    showToast("Appointment Booked Successfully!", "success");
    navigate('/appointments');
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] animate-fade-in relative bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
      
      {/* Background Ambient Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[150px] opacity-20"></div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600 rounded-full blur-[120px] opacity-20"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col lg:flex-row">
        
        {/* Left: The Mirror (Video/Image) */}
        <div className="flex-1 relative flex flex-col justify-center items-center p-8 border-r border-white/10 bg-white/5 backdrop-blur-sm">
           
           <h2 className="absolute top-8 left-8 text-2xl font-bold text-white tracking-wider flex items-center gap-3">
             <i className="fa-solid fa-wand-magic-sparkles text-purple-400"></i> AI Magic Mirror
           </h2>

           {!capturedImage && !isCameraOpen && (
             <div className="text-center space-y-8 animate-float">
               <div className="w-40 h-40 bg-white/10 rounded-full flex items-center justify-center mx-auto text-white/50 text-6xl ring-4 ring-white/5 backdrop-blur-md">
                 <i className="fa-solid fa-camera"></i>
               </div>
               <div className="flex flex-col gap-4 w-64 mx-auto">
                 <button onClick={startCamera} className="bg-white text-black px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-white/20 transition-all hover:scale-105">
                   Start Session
                 </button>
                 <label className="cursor-pointer text-gray-400 hover:text-white text-sm font-medium transition-colors text-center">
                   <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                   Or Upload a Photo
                 </label>
               </div>
             </div>
           )}

           {isCameraOpen && (
             <div className="relative w-full max-w-lg aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/20">
               <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
               <div className="absolute bottom-6 left-0 w-full flex justify-center">
                 <button onClick={capturePhoto} className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 ring-4 ring-white/30 flex items-center justify-center hover:scale-110 transition-transform"></button>
               </div>
               <canvas ref={canvasRef} className="hidden" />
             </div>
           )}

           {capturedImage && (
             <div className="relative w-full max-w-lg aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/20 group">
               <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                 <button onClick={() => setCapturedImage(null)} className="px-6 py-2 bg-white/20 text-white border border-white/50 rounded-full hover:bg-white hover:text-black transition-all">
                   Retake Photo
                 </button>
               </div>
               
               {isAnalyzing && (
                 <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-md z-20">
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-indigo-200 font-mono animate-pulse">Scanning Facial Features...</p>
                 </div>
               )}
             </div>
           )}
        </div>

        {/* Right: The Data (HUD) */}
        <div className="lg:w-[450px] bg-black/40 backdrop-blur-md p-8 flex flex-col border-l border-white/5 overflow-y-auto">
          
          {!analysisResult ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-center space-y-4">
              <i className="fa-solid fa-fingerprint text-5xl opacity-30"></i>
              <p className="text-sm uppercase tracking-widest font-mono">Waiting for input...</p>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in-up">
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Face Shape</p>
                  <p className="text-white font-bold">{analysisResult.faceShape}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Complexion</p>
                  <p className="text-white font-bold">{analysisResult.skinTone}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Est. Age</p>
                  <p className="text-white font-bold">{analysisResult.ageGroup}</p>
                </div>
              </div>

              <div>
                <h3 className="text-indigo-400 font-bold uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  AI Recommendations
                </h3>
                <div className="space-y-4">
                  {analysisResult.recommendations.map((rec: any, index: number) => (
                    <div key={index} className="bg-gradient-to-r from-white/10 to-transparent p-4 rounded-xl border-l-2 border-indigo-500 hover:bg-white/15 transition-colors group">
                       <h4 className="font-bold text-white text-lg">{rec.service}</h4>
                       <p className="text-xs text-gray-400 mt-2 leading-relaxed">{rec.reason}</p>
                       <button 
                         onClick={() => handleBookClick(rec)}
                         className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all"
                       >
                         Book Now
                       </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Dark Themed Booking Modal */}
      {isBookingModalOpen && selectedRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in text-white">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold">Confirm Booking</h3>
               <button onClick={() => setIsBookingModalOpen(false)} className="text-gray-400 hover:text-white"><i className="fa-solid fa-times"></i></button>
             </div>

             <div className="bg-indigo-900/30 p-4 rounded-xl border border-indigo-500/30 mb-6">
                <p className="text-xs text-indigo-400 font-bold uppercase mb-1">Service</p>
                <h4 className="text-lg font-bold text-white">{selectedRec.service}</h4>
             </div>

             <div className="space-y-4 mb-8">
               <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Customer Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Enter Name"
                    value={customerForm.name}
                    onChange={e => setCustomerForm({...customerForm, name: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Enter Phone"
                    value={customerForm.phone}
                    onChange={e => setCustomerForm({...customerForm, phone: e.target.value})}
                  />
               </div>
             </div>

             <div className="flex gap-3">
               <button onClick={() => setIsBookingModalOpen(false)} className="flex-1 py-3 text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium">Cancel</button>
               <button onClick={handleConfirmBooking} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-500/20">
                 Confirm
               </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AIConsult;