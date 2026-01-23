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
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        showToast("Camera permission denied. Please enable access in your browser settings.", "error");
      } else {
        showToast("Could not access camera. Please try uploading a photo instead.", "error");
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Match canvas size to video size
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        setIsCameraOpen(false);
        
        // Stop all video streams
        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!capturedImage) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeCustomerFace(capturedImage);
      setAnalysisResult(result);
      
      // Save consultation to DB (Supabase/Local)
      DB.saveAIConsultation({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        image: capturedImage,
        result: result
      });
      
      showToast("Analysis Complete!", "success");
    } catch (error) {
      showToast("Analysis failed. Try again.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBookClick = (rec: any) => {
    setSelectedRec(rec);
    // Reset form or try to auto-fill if we had facial recognition identity
    setCustomerForm({ name: '', phone: '' });
    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = () => {
    if (!customerForm.name || !customerForm.phone) {
        showToast("Please enter Name and Phone to proceed.", "error");
        return;
    }

    // 1. Check or Create Customer
    let customer = DB.getCustomers().find(c => c.phone === customerForm.phone);
    let customerId = customer?.id;

    if (!customer) {
        const newCust: Customer = {
            id: Date.now().toString(),
            name: customerForm.name,
            phone: customerForm.phone,
            totalVisits: 0,
            loyaltyPoints: 0,
            photo: capturedImage || undefined // Attach the AI analyzed photo to profile
        };
        DB.saveCustomer(newCust);
        customerId = newCust.id;
        showToast("New Customer Profile Created!", "success");
    } else {
        // Update name if different? Keep existing for now.
        showToast(`Welcome back, ${customer.name}!`, "success");
    }

    // 2. Resolve Service
    // Attempt to match the recommended service name with existing services
    const services = DB.getServices();
    // Simple fuzzy match logic
    const matchedService = services.find(s => 
        s.name.toLowerCase().includes(selectedRec.service.toLowerCase()) || 
        selectedRec.service.toLowerCase().includes(s.name.toLowerCase())
    );

    const serviceId = matchedService ? matchedService.id : services[0]?.id; // Fallback to first service
    const notes = matchedService 
        ? `AI Recommendation: ${selectedRec.reason}` 
        : `AI Recommended: ${selectedRec.service}. Reason: ${selectedRec.reason}`;

    if (!serviceId) {
        showToast("No services available to book.", "error");
        return;
    }

    // 3. Create Appointment
    const newAppt: Appointment = {
        id: Date.now().toString(),
        customerId: customerId!,
        staffId: DB.getStaff().filter(s => s.status === 'active')[0]?.id || '1', // Assign to first active staff
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
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in relative">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
          <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>AI Smart Consultant
        </h2>
        <p className="text-gray-500 mt-2">
          Let our AI analyze your features and recommend the perfect style.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-50 flex flex-col items-center justify-center min-h-[400px]">
          
          {!capturedImage && !isCameraOpen && (
            <div className="text-center space-y-6">
               <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-400 text-5xl mb-4">
                 <i className="fa-solid fa-camera"></i>
               </div>
               <div className="flex flex-col gap-3">
                 <button onClick={startCamera} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all hover:scale-105">
                   <i className="fa-solid fa-camera mr-2"></i> Start Camera
                 </button>
                 <span className="text-gray-400 text-sm">- OR -</span>
                 <label className="cursor-pointer bg-white border border-gray-200 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all">
                   <i className="fa-solid fa-upload mr-2"></i> Upload Photo
                   <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                 </label>
               </div>
            </div>
          )}

          {isCameraOpen && (
            <div className="relative w-full h-full flex flex-col items-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-xl shadow-inner mb-4 max-h-[400px] object-cover" />
              <button onClick={capturePhoto} className="absolute bottom-8 bg-white text-indigo-600 w-16 h-16 rounded-full border-4 border-indigo-100 flex items-center justify-center hover:scale-110 transition-all shadow-xl">
                 <i className="fa-solid fa-camera text-2xl"></i>
              </button>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {capturedImage && (
            <div className="w-full flex flex-col items-center">
              <img src={capturedImage} alt="Captured" className="rounded-xl shadow-lg max-h-[350px] object-cover mb-6 border-4 border-white" />
              <div className="flex gap-4">
                 <button onClick={() => setCapturedImage(null)} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium">
                   Retake
                 </button>
                 <button 
                  onClick={runAnalysis} 
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                   {isAnalyzing ? (
                     <><i className="fa-solid fa-circle-notch fa-spin"></i> Analyzing...</>
                   ) : (
                     <><i className="fa-solid fa-bolt"></i> Analyze Now</>
                   )}
                 </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 min-h-[400px] relative overflow-hidden">
           {!analysisResult ? (
             <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-center p-8">
               <div>
                 <i className="fa-solid fa-face-smile-wink text-6xl mb-4 opacity-20"></i>
                 <p>Capture or upload a photo to see AI recommendations here.</p>
               </div>
             </div>
           ) : (
             <div className="space-y-6 relative z-10 animate-fade-in-up">
               <div className="grid grid-cols-3 gap-4 mb-6">
                 <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                   <p className="text-xs text-gray-500 uppercase font-bold">Face Shape</p>
                   <p className="font-bold text-indigo-700">{analysisResult.faceShape}</p>
                 </div>
                 <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                   <p className="text-xs text-gray-500 uppercase font-bold">Skin Tone</p>
                   <p className="font-bold text-indigo-700">{analysisResult.skinTone}</p>
                 </div>
                 <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                   <p className="text-xs text-gray-500 uppercase font-bold">Est. Age</p>
                   <p className="font-bold text-indigo-700">{analysisResult.ageGroup}</p>
                 </div>
               </div>

               <h3 className="font-bold text-lg text-slate-800 border-b pb-2">Top Recommendations</h3>
               <div className="space-y-4">
                 {analysisResult.recommendations.map((rec: any, index: number) => (
                   <div key={index} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-500 flex justify-between items-center group hover:shadow-md transition-all">
                      <div>
                        <h4 className="font-bold text-slate-800">{rec.service}</h4>
                        <p className="text-sm text-gray-500 mt-1">{rec.reason}</p>
                      </div>
                      <button 
                        onClick={() => handleBookClick(rec)}
                        className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-700 shadow-sm"
                      >
                        Book
                      </button>
                   </div>
                 ))}
               </div>
               
               <div className="mt-8 p-4 bg-indigo-900 text-indigo-100 rounded-xl text-sm flex items-start gap-3">
                 <i className="fa-solid fa-robot mt-1"></i>
                 <p>AI analysis is based on visual features. Results may vary lighting conditions.</p>
               </div>
             </div>
           )}
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      {isBookingModalOpen && selectedRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-slate-800">Confirm Booking</h3>
               <button onClick={() => setIsBookingModalOpen(false)} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-times text-lg"></i></button>
             </div>

             <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-6">
                <p className="text-xs text-purple-600 font-bold uppercase mb-1">Service to Book</p>
                <h4 className="text-lg font-bold text-purple-900">{selectedRec.service}</h4>
                <p className="text-sm text-purple-700 mt-1 italic">"{selectedRec.reason}"</p>
             </div>

             <div className="space-y-4 mb-6">
               <p className="text-sm text-gray-600">Please confirm user details to proceed with the appointment.</p>
               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Customer Name</label>
                  <input 
                    type="text" 
                    className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter Name"
                    value={customerForm.name}
                    onChange={e => setCustomerForm({...customerForm, name: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter Phone"
                    value={customerForm.phone}
                    onChange={e => setCustomerForm({...customerForm, phone: e.target.value})}
                  />
               </div>
             </div>

             <div className="flex gap-3">
               <button onClick={() => setIsBookingModalOpen(false)} className="flex-1 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
               <button onClick={handleConfirmBooking} className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-bold shadow-lg hover:bg-purple-700">
                 Approve & Book
               </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AIConsult;