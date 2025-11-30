import React, { useState, useRef, useEffect } from 'react';
import { Camera, ChevronRight, ChevronLeft, Printer, Upload, Scan, Wifi, WifiOff } from 'lucide-react';

const DMEIntakeSystem = () => {
  const [mode, setMode] = useState('setup');
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState(null);
  const [eventDate, setEventDate] = useState('');
  const [eventName, setEventName] = useState('');
  const [insuranceCardFrontImg, setInsuranceCardFrontImg] = useState(null);
  const [insuranceCardBackImg, setInsuranceCardBackImg] = useState(null);
  const [driversLicenseImg, setDriversLicenseImg] = useState(null);
  const [autoRouted, setAutoRouted] = useState(false);
  const [signatures, setSigs] = useState({provider: null, acknowledgment: null, hipaa: null});
  const [drawing, setDrawing] = useState(false);
  const [activeCanvas, setActiveCanvas] = useState(null);
  const [patientPrescription, setPatientPrescription] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSaved, setLastSaved] = useState(null);
  
  const [showCardCapture, setShowCardCapture] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const nativeCameraInsFrontRef = useRef(null);
  const nativeCameraInsBackRef = useRef(null);
  const nativeCameraDLRef = useRef(null);
  
  const insCardFrontRef = useRef(null);
  const insCardBackRef = useRef(null);
  const dlRef = useRef(null);
  const rxRef = useRef(null);
  const providerCanvasRef = useRef(null);
  const acknowledgmentCanvasRef = useRef(null);
  const hipaaCanvasRef = useRef(null);

  const cleanupCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Handle native camera capture with compression and landscape orientation
  const handleNativeCameraCapture = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 600;
        
        // Check if image is portrait (taller than wide) and rotate to landscape
        const isPortrait = img.height > img.width;
        
        if (isPortrait) {
          // Rotate 90 degrees for landscape
          const scale = Math.min(maxWidth / img.height, 1);
          canvas.width = img.height * scale;
          canvas.height = img.width * scale;
          const ctx = canvas.getContext('2d');
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(90 * Math.PI / 180);
          ctx.drawImage(img, -img.width * scale / 2, -img.height * scale / 2, img.width * scale, img.height * scale);
        } else {
          // Already landscape
          const scale = Math.min(maxWidth / img.width, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        
        const compressedData = canvas.toDataURL('image/jpeg', 0.8);
        
        if (type === 'insuranceFront') {
          setInsuranceCardFrontImg(compressedData);
        } else if (type === 'insuranceBack') {
          setInsuranceCardBackImg(compressedData);
        } else if (type === 'license') {
          setDriversLicenseImg(compressedData);
        }
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
    
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  const startCardCapture = async (type) => {
    // First ensure any existing stream is fully stopped
    cleanupCamera();
    
    setShowCardCapture(type);
    
    // Longer delay to ensure iOS releases the camera
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      streamRef.current = stream;
      // Wait for video element to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Camera error:', err);
      alert('Could not access camera. Please try again or use file upload.');
      setShowCardCapture(null);
    }
  };

  const captureCard = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Card aspect ratio is roughly 3.375 x 2.125 inches (credit card size)
    const cardRatio = 3.375 / 2.125; // ~1.59
    
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // Calculate the crop area (center 70% of the video, matching card ratio)
    const cropWidth = videoWidth * 0.75;
    const cropHeight = cropWidth / cardRatio;
    const cropX = (videoWidth - cropWidth) / 2;
    const cropY = (videoHeight - cropHeight) / 2;
    
    // Set canvas to a reasonable output size
    canvas.width = 600;
    canvas.height = 375; // Maintains card ratio
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    if (showCardCapture === 'insurance') {
      setInsuranceCardImg(imageData);
    } else if (showCardCapture === 'license') {
      setDriversLicenseImg(imageData);
    }
    
    stopCardCapture();
  };

  const stopCardCapture = () => {
    cleanupCamera();
    setShowCardCapture(null);
  };

  // Cleanup camera on unmount or mode change
  useEffect(() => {
    return () => {
      cleanupCamera();
    };
  }, [mode]);
  
  const companies = {
    bgbracing: {
      name: 'BG Bracing, LLC',
      address: '84 Hopper Ave.',
      city: 'Pompton Plains',
      state: 'NJ',
      zip: '07444',
      phone: '(973) 363-9011',
      fax: '(973) 341-7791',
      email: 'bgbracinggear@gmail.com',
      website: 'www.bracinggear.com',
      npi: '1234567890',
      taxId: '12-3456789',
      referringProvider: 'Dr. Jack Atzmon, DC',
      referringNPI: '1962565648'
    },
    njback: {
      name: 'NJback Chiropractic Center, LLC',
      address: '47 Hamburg Turnpike',
      city: 'Riverdale',
      state: 'NJ',
      zip: '07457',
      phone: '(973) 874-9777',
      fax: '(973) 341-7791',
      email: 'info@njback.com',
      website: 'www.njback.com',
      npi: '1720184498',
      taxId: '81-4921270',
      referringProvider: 'Dr. Jack Atzmon, DC',
      referringNPI: '1962565648'
    }
  };

  const [data, setData] = useState({
    firstName: '', lastName: '', middleName: '', age: '', dob: '', sex: '', 
    address: '', city: '', state: 'NJ', zip: '', phone: '', email: '', employer: '',
    primaryIns: '', primaryID: '', primaryGroup: '',
    complaints: ['lbp'], onsetDate: '', duration: 'Chronic (>3 mo)', painLevel: '6', painDesc: [],
    limitations: ['Difficulty standing'], priorCare: ['Home Treatment'], medicalHistory: ['No Significant Medical History'],
    device: ['L0631', 'E0730'], dateDelivered: '', patientInitials: '',
    primaryICD: 'M54.50',
    additionalICD: [],
    postureGait: 'Guarded',
    lumbarMobility: 'Moderate Restriction',
    painBehavior: ['Pain on Movement'],
    functionalImpact: ['Difficulty Standing/Sitting'],
    otherNotes: '',
    mechanicalLBPFindings: true,
    lengthOfNeed: '3 months'
  });

  const update = (field, value) => setData(prev => ({...prev, [field]: value}));
  
  const toggleArray = (field, value) => {
    const arr = data[field];
    update(field, arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  };

  // Auto-save to localStorage every time data changes (excluding large images)
  useEffect(() => {
    if (mode === 'intake' && step > 0) {
      try {
        const saveData = {
          mode,
          step,
          company,
          eventDate,
          eventName,
          data,
          signatures,
          autoRouted,
          hasInsuranceCardFront: !!insuranceCardFrontImg,
          hasInsuranceCardBack: !!insuranceCardBackImg,
          hasDriversLicense: !!driversLicenseImg,
          hasRx: !!patientPrescription,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('dme-intake-current', JSON.stringify(saveData));
        setLastSaved(new Date().toLocaleTimeString());
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }
    }
  }, [data, step, mode, signatures, company, eventDate, eventName, autoRouted]);

  // Load saved data on mount (images are not saved, only form data)
  useEffect(() => {
    const saved = localStorage.getItem('dme-intake-current');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (window.confirm(`Resume saved session from ${new Date(parsed.timestamp).toLocaleString()}?\n\n(Note: Photos will need to be retaken)`)) {
          setMode(parsed.mode);
          setStep(parsed.step);
          setCompany(parsed.company);
          setEventDate(parsed.eventDate);
          setEventName(parsed.eventName);
          setData(parsed.data);
          setSigs(parsed.signatures || {provider: null, acknowledgment: null, hipaa: null});
          setAutoRouted(parsed.autoRouted);
          // Images are not restored - they need to be retaken
        } else {
          localStorage.removeItem('dme-intake-current');
        }
      } catch (e) {
        console.error('Error loading saved data:', e);
        localStorage.removeItem('dme-intake-current');
      }
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const autoRouteCompany = (insuranceName) => {
    const insLower = insuranceName.toLowerCase();
    if (insLower.includes('horizon') || insLower.includes('united healthcare') || insLower.includes('uhc')) {
      setCompany('njback');
      setAutoRouted(true);
      return 'njback';
    } else {
      setCompany('bgbracing');
      setAutoRouted(true);
      return 'bgbracing';
    }
  };

  const handleInsCardFrontUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 600;
        const isPortrait = img.height > img.width;
        
        if (isPortrait) {
          const scale = Math.min(maxWidth / img.height, 1);
          canvas.width = img.height * scale;
          canvas.height = img.width * scale;
          const ctx = canvas.getContext('2d');
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(90 * Math.PI / 180);
          ctx.drawImage(img, -img.width * scale / 2, -img.height * scale / 2, img.width * scale, img.height * scale);
        } else {
          const scale = Math.min(maxWidth / img.width, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        
        const compressedData = canvas.toDataURL('image/jpeg', 0.8);
        setInsuranceCardFrontImg(compressedData);
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleInsCardBackUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 600;
        const isPortrait = img.height > img.width;
        
        if (isPortrait) {
          const scale = Math.min(maxWidth / img.height, 1);
          canvas.width = img.height * scale;
          canvas.height = img.width * scale;
          const ctx = canvas.getContext('2d');
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(90 * Math.PI / 180);
          ctx.drawImage(img, -img.width * scale / 2, -img.height * scale / 2, img.width * scale, img.height * scale);
        } else {
          const scale = Math.min(maxWidth / img.width, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        
        const compressedData = canvas.toDataURL('image/jpeg', 0.8);
        setInsuranceCardBackImg(compressedData);
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDLUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 600;
        const isPortrait = img.height > img.width;
        
        if (isPortrait) {
          const scale = Math.min(maxWidth / img.height, 1);
          canvas.width = img.height * scale;
          canvas.height = img.width * scale;
          const ctx = canvas.getContext('2d');
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(90 * Math.PI / 180);
          ctx.drawImage(img, -img.width * scale / 2, -img.height * scale / 2, img.width * scale, img.height * scale);
        } else {
          const scale = Math.min(maxWidth / img.width, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        
        const compressedData = canvas.toDataURL('image/jpeg', 0.8);
        setDriversLicenseImg(compressedData);
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRxUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setPatientPrescription(evt.target.result);
    reader.readAsDataURL(file);
  };

  const getCanvasCoordinates = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDraw = (canvasRef) => (e) => {
    e.preventDefault();
    setActiveCanvas(canvasRef);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    
    const coords = getCanvasCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing || !activeCanvas) return;
    e.preventDefault();
    const canvas = activeCanvas.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const coords = getCanvasCoordinates(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDraw = () => setDrawing(false);
  
  const clearSig = (canvasRef) => {
    if (!canvasRef.current) return;
    canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };
  
  const saveSig = (canvasRef, type) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const isEmpty = !imageData.some(channel => channel !== 0);
    
    if (isEmpty) {
      alert('Please sign before saving');
      return;
    }
    
    setSigs(prev => ({...prev, [type]: canvas.toDataURL()}));
  };

  const startNewPatient = () => {
    if (window.confirm('Start new patient for this event?')) {
      // Clean up camera first
      cleanupCamera();
      
      setData({
        firstName: '', lastName: '', middleName: '', age: '', dob: '', sex: '', 
        address: '', city: '', state: 'NJ', zip: '', phone: '', email: '', employer: '',
        primaryIns: '', primaryID: '', primaryGroup: '',
        complaints: ['lbp'], onsetDate: eventDate, duration: 'Chronic (>3 mo)', painLevel: '6', painDesc: [],
        limitations: ['Difficulty standing'], priorCare: ['Home Treatment'], medicalHistory: ['No Significant Medical History'],
        device: ['L0631', 'E0730'], dateDelivered: eventDate, patientInitials: '',
        primaryICD: 'M54.50',
        additionalICD: [],
        postureGait: 'Guarded',
        lumbarMobility: 'Moderate Restriction',
        painBehavior: ['Pain on Movement'],
        functionalImpact: ['Difficulty Standing/Sitting'],
        otherNotes: '',
        mechanicalLBPFindings: true,
        lengthOfNeed: '3 months'
      });
      setSigs({provider: null, acknowledgment: null, hipaa: null});
      setInsuranceCardFrontImg(null);
      setInsuranceCardBackImg(null);
      setDriversLicenseImg(null);
      setPatientPrescription(null);
      setAutoRouted(false);
      setCompany(null);
      setShowCardCapture(null);
      setMode('capture');
      setStep(0);
    }
  };

  const changeEvent = () => {
    if (window.confirm('Change event? All data will be cleared.')) {
      localStorage.removeItem('dme-intake-current');
      setMode('setup');
      setStep(0);
      setEventDate('');
      setEventName('');
      setCompany(null);
      setAutoRouted(false);
      setInsuranceCardFrontImg(null);
      setInsuranceCardBackImg(null);
      setDriversLicenseImg(null);
      setPatientPrescription(null);
      setData({
        firstName: '', lastName: '', middleName: '', age: '', dob: '', sex: '', 
        address: '', city: '', state: '', zip: '', phone: '', email: '', employer: '',
        primaryIns: '', primaryID: '', primaryGroup: '',
        complaints: [], onsetDate: '', duration: '', painLevel: '6', painDesc: [],
        limitations: [], priorCare: [], medicalHistory: [],
        device: [], dateDelivered: '', patientInitials: '',
        primaryICD: 'M54.50',
        additionalICD: [],
        postureGait: '',
        lumbarMobility: '',
        painBehavior: [],
        functionalImpact: [],
        otherNotes: '',
        mechanicalLBPFindings: false,
        lengthOfNeed: '3 months'
      });
      setSigs({provider: null, acknowledgment: null, hipaa: null});
    }
  };

  const providerAttestationText = `I certify that I personally evaluated the patient, documented objective findings, performed and/or supervised custom fitting, and determined the prescribed orthosis is medically necessary under CMS and payer coverage standards. Custom fitting included bending, cutting, and/or sizing and instructing the patient on the use of the brace.`;

  const patientAcknowledgmentText = `I authorize B.G. Bracing LLC and my provider to release any medical information necessary to process insurance claims and receive direct payment of benefits. I acknowledge financial responsibility for non-covered charges. I confirm I have received and been custom fitted for the devices indicated above and was instructed in proper use and care.`;

  const hipaaAcknowledgmentText = `I acknowledge receipt of the Notice of Privacy Practices.`;

  const generatePacketHTML = () => {
    const fullName = `${data.firstName} ${data.middleName ? data.middleName + ' ' : ''}${data.lastName}`;
    const today = eventDate || new Date().toLocaleDateString();
    const companyInfo = companies[company] || companies.bgbracing;
    
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>DME Claim - ${fullName}</title>
<style>
@page{size:letter;margin:0.5in}
body{font-family:Arial,sans-serif;font-size:9pt;margin:0;padding:15px}
.header{text-align:center;margin-bottom:15px;border-bottom:3px solid #000;padding-bottom:8px}
.company-name{font-size:16pt;font-weight:bold}
.section-title{background:#333;color:white;padding:6px 8px;font-weight:bold;margin-top:12px;font-size:10pt}
.subsection-title{background:#666;color:white;padding:4px 8px;font-weight:bold;margin-top:8px;font-size:9pt}
.field{margin:3px 0}
.label{font-weight:bold;display:inline-block;min-width:120px}
.sig-img{max-height:50px;border-bottom:1px solid #000;margin-top:3px}
.doc-img{width:3.375in;height:auto;border:1px solid #000;margin:8px 0;display:block}
table{width:100%;border-collapse:collapse;margin:8px 0}
th,td{border:1px solid #000;padding:5px;text-align:left;font-size:9pt}
th{background:#e0e0e0;font-weight:bold}
.box{border:1px solid #000;padding:8px;margin:8px 0;background:#f9f9f9}
.highlight-box{border:2px solid #06c;background:#e8f4fd;padding:8px;margin:8px 0}
.red-box{border:2px solid #c00;background:#fee;padding:8px;margin:8px 0;font-weight:bold}
.yellow-box{border:2px solid #c90;background:#fffbea;padding:8px;margin:8px 0}
.attestation-box{border:1px solid #333;padding:10px;margin:10px 0;background:#fafafa}
.attestation-text{font-size:8pt;margin-bottom:8px;line-height:1.4}
ul{margin:3px 0 3px 15px;padding:0}
li{margin:2px 0}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.compliance-box{border:2px solid #000;padding:10px;margin:10px 0;background:#fffff0}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body>

<div class="header">
<div class="company-name">${companyInfo.name}</div>
<div style="font-size:10pt;margin-top:4px;">${companyInfo.address}, ${companyInfo.city}, ${companyInfo.state} ${companyInfo.zip}</div>
<div style="margin-top:6px;">
<span style="margin-right:15px;">📞 ${companyInfo.phone}</span>
<span style="margin-right:15px;">📠 ${companyInfo.fax}</span>
</div>
<div style="margin-top:4px;">
<span style="margin-right:15px;">✉️ ${companyInfo.email}</span>
<span>🌐 ${companyInfo.website}</span>
</div>
<div style="margin-top:4px;font-size:9pt;color:#555;">NPI: ${companyInfo.npi}</div>
<div style="margin-top:12px;font-size:14pt;font-weight:bold;background:#333;color:white;padding:8px;border-radius:4px;">DME CLAIM PACKET</div>
<div style="margin-top:6px;font-size:11pt;">Date of Service: <strong>${today}</strong></div>
</div>

<div class="section-title">PATIENT INFORMATION</div>
<div class="grid-2">
<div><span class="label">Name:</span> ${fullName}</div>
<div><span class="label">DOB:</span> ${data.dob} | Age: ${data.age} | Sex: ${data.sex}</div>
</div>
<div class="field"><span class="label">Address:</span> ${data.address}, ${data.city}, ${data.state} ${data.zip}</div>
<div class="field"><span class="label">Phone:</span> ${data.phone} | <span class="label">Email:</span> ${data.email}</div>
${data.employer ? `<div class="field"><span class="label">Employer:</span> ${data.employer}</div>` : ''}

<div class="section-title">INSURANCE INFORMATION</div>
<div class="field"><span class="label">Insurance:</span> ${data.primaryIns}</div>
<div class="field"><span class="label">Member ID:</span> ${data.primaryID} | <span class="label">Group:</span> ${data.primaryGroup || 'N/A'}</div>

<div class="section-title">MEDICAL HISTORY & PRIOR CARE</div>
${data.medicalHistory.length > 0 ? `<div class="field"><span class="label">Medical History:</span> ${data.medicalHistory.join(', ')}</div>` : '<div class="field"><span class="label">Medical History:</span> None reported</div>'}
${data.priorCare.length > 0 ? `<div class="field"><span class="label">Prior Care:</span> ${data.priorCare.join(', ')}</div>` : '<div class="field"><span class="label">Prior Care:</span> None reported</div>'}

<div class="section-title">CLINICAL ASSESSMENT</div>
<div class="field"><span class="label">Chief Complaints:</span> ${data.complaints.map(c => c === 'lbp' ? 'Lower back pain' : c === 'lumbar' ? 'Lumbar instability' : c === 'degen' ? 'Degenerative disc' : c).join(', ') || 'None selected'}</div>
<div class="grid-2">
<div><span class="label">Pain Level:</span> ${data.painLevel}/10</div>
<div><span class="label">Onset Date:</span> ${data.onsetDate}</div>
</div>
<div class="field"><span class="label">Duration:</span> ${data.duration || 'Not specified'}</div>
${data.limitations.length > 0 ? `<div class="field"><span class="label">Functional Limitations:</span> ${data.limitations.join(', ')}</div>` : ''}

<div class="subsection-title">Objective Assessment</div>
<div class="field"><span class="label">Posture/Gait:</span> ${data.postureGait || 'Not assessed'}</div>
<div class="field"><span class="label">Lumbar Mobility:</span> ${data.lumbarMobility || 'Not assessed'}</div>
${data.painBehavior.length > 0 ? `<div class="field"><span class="label">Pain Behavior:</span> ${data.painBehavior.join(', ')}</div>` : ''}
${data.functionalImpact.length > 0 ? `<div class="field"><span class="label">Functional Impact:</span> ${data.functionalImpact.join(', ')}</div>` : ''}
${data.otherNotes ? `<div class="field"><span class="label">Other Notes:</span> ${data.otherNotes}</div>` : ''}

${data.mechanicalLBPFindings ? '<div class="highlight-box">✓ Findings are consistent with mechanical low back pain requiring external stabilization to reduce motion, improve function, and decrease pain.</div>' : ''}

<div class="section-title">DIAGNOSIS & PLAN</div>
<div class="subsection-title">ICD-10 Codes</div>
<div class="field">✓ M54.50 - Low Back Pain, Unspecified</div>
${data.additionalICD.includes('M51.16') ? '<div class="field">✓ M51.16 - Degenerative Disc Disease (Lumbar)</div>' : ''}
${data.additionalICD.includes('M47.819') ? '<div class="field">✓ M47.819 - Spondylosis, Unspecified</div>' : ''}

<div class="box">
<strong>Assessment Summary:</strong><br/>
Evaluation demonstrates mechanical low back pain with postural imbalance and limited motion consistent with need for external stabilization to reduce pain and improve function.
<ul>
<li>Recommend Lumbar Orthosis (L0631) and/or TENS Unit (E0730) for reduction of pain and stabilization</li>
<li>Refer to chiropractic or physical therapy for active rehabilitation</li>
<li>Instruct patient on home stretching, posture, and brace wear</li>
</ul>
</div>

<div class="box">
The above listed orthotic devices are medically necessary for treatment of lower back pain (M54.50) as part of a conservative care plan. The orthosis is prescribed to:
<ul>
<li>Reduce pain by limiting trunk motion</li>
<li>Improve function and posture</li>
<li>Prevent further injury and support spinal stability</li>
</ul>
Conservative measures (exercise, OTC medication, chiropractic/PT care) have been reviewed. Patient instructed in safe use, care, and expected outcomes.
</div>

<div class="red-box">Patient Initials: ${data.patientInitials || '______'}</div>

<div class="section-title">DEVICES PRESCRIBED</div>
<table>
<tr><th>Device</th><th>HCPCS Code</th><th>Indication</th></tr>
${data.device.includes('L0631') ? '<tr><td>Lumbar Sacral Orthosis</td><td>L0631</td><td>Pain reduction and stabilization</td></tr>' : ''}
${data.device.includes('E0730') ? '<tr><td>TENS Unit</td><td>E0730</td><td>Adjunct pain management</td></tr>' : ''}
</table>
<div class="field"><span class="label">Frequency:</span> 6 hours per day</div>
<div class="field"><span class="label">Duration:</span> 3 months</div>
<div class="field"><span class="label">Length of Need:</span> ${data.lengthOfNeed}</div>
<div class="field"><span class="label">Date Delivered:</span> ${data.dateDelivered || today}</div>

<div class="compliance-box">
<strong>COMPLIANCE STATEMENT:</strong><br/>
This orthosis is not prescribed for comfort or posture correction alone but as part of a structured conservative treatment plan consistent with Aetna CPB #298 and CMS LCD L33802.
</div>

<div class="section-title">SIGNATURES</div>

<div class="attestation-box">
<div class="subsection-title" style="margin-top:0">Provider Attestation</div>
<div class="attestation-text">${providerAttestationText}</div>
<div class="field"><span class="label">Provider:</span> ${companyInfo.referringProvider} | NPI: ${companyInfo.referringNPI}</div>
${signatures.provider ? `<img src="${signatures.provider}" class="sig-img"/>` : '<div style="border-bottom:1px solid #000;height:40px;margin-top:5px"></div>'}
<div class="field"><span class="label">Date:</span> ${today}</div>
</div>

<div class="attestation-box">
<div class="subsection-title" style="margin-top:0">Patient Acknowledgment</div>
<div class="attestation-text">${patientAcknowledgmentText}</div>
${signatures.acknowledgment ? `<img src="${signatures.acknowledgment}" class="sig-img"/>` : '<div style="border-bottom:1px solid #000;height:40px;margin-top:5px"></div>'}
<div class="field"><span class="label">Date:</span> ${today}</div>
</div>

<div class="attestation-box">
<div class="subsection-title" style="margin-top:0">HIPAA Acknowledgment</div>
<div class="attestation-text">${hipaaAcknowledgmentText}</div>
${signatures.hipaa ? `<img src="${signatures.hipaa}" class="sig-img"/>` : '<div style="border-bottom:1px solid #000;height:40px;margin-top:5px"></div>'}
<div class="field"><span class="label">Date:</span> ${today}</div>
</div>

<div style="page-break-before: always;"></div>

<div class="section-title">SUPPORTING DOCUMENTS</div>

${insuranceCardFrontImg || insuranceCardBackImg ? `
<div class="subsection-title">Insurance Card</div>
<div class="grid-2">
${insuranceCardFrontImg ? `<div><div style="font-size:8pt;margin-bottom:4px;"><strong>Front:</strong></div><img src="${insuranceCardFrontImg}" class="doc-img"/></div>` : ''}
${insuranceCardBackImg ? `<div><div style="font-size:8pt;margin-bottom:4px;"><strong>Back:</strong></div><img src="${insuranceCardBackImg}" class="doc-img"/></div>` : ''}
</div>
` : ''}

${driversLicenseImg ? `
<div class="subsection-title">Driver's License</div>
<div><img src="${driversLicenseImg}" class="doc-img"/></div>
` : ''}

</body></html>`;
  };

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      alert('Please allow popups');
      return;
    }
    
    const fileName = `${data.lastName}_${data.firstName}_${eventDate}`;
    
    const printButtons = `
      <style>
        @media print {
          #print-controls { display: none !important; }
          #print-spacer { display: none !important; }
        }
      </style>
      <title>${fileName}</title>
      <div id="print-controls" style="position:fixed;top:0;left:0;right:0;background:#333;padding:15px;display:flex;gap:15px;justify-content:center;z-index:9999;box-shadow:0 2px 10px rgba(0,0,0,0.3);">
        <button onclick="window.print();" style="background:#22c55e;color:white;border:none;padding:12px 30px;font-size:16px;font-weight:bold;border-radius:8px;cursor:pointer;">
          📄 Save / Print PDF
        </button>
        <button onclick="window.close();" style="background:#ef4444;color:white;border:none;padding:12px 30px;font-size:16px;font-weight:bold;border-radius:8px;cursor:pointer;">
          ✕ Close
        </button>
      </div>
      <div id="print-spacer" style="height:70px;"></div>
    `;
    
    const htmlContent = generatePacketHTML();
    // Replace the title in the HTML
    const modifiedHTML = htmlContent
      .replace(/<title>.*?<\/title>/, `<title>${fileName}</title>`)
      .replace('<body>', '<body>' + printButtons);
    
    win.document.write(modifiedHTML);
    win.document.close();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Online/Offline Status Indicator */}
        {mode !== 'setup' && (
          <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isOnline ? <Wifi className="w-5 h-5"/> : <WifiOff className="w-5 h-5"/>}
            <div>
              <div className="font-bold text-sm">{isOnline ? 'Online' : 'Offline'}</div>
              {lastSaved && <div className="text-xs">Saved: {lastSaved}</div>}
            </div>
          </div>
        )}
        
        {mode === 'setup' && (
          <div className="bg-white rounded-lg shadow p-8">
            <h1 className="text-3xl font-bold mb-6">Event Setup</h1>
            
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Event Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Event Name * (Internal Use Only)</label>
                  <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g., Springfield Health Fair 2024" className="w-full border-2 rounded-lg px-4 py-3 text-lg"/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Event Date *</label>
                  <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="w-full border-2 rounded-lg px-4 py-3 text-lg"/>
                </div>
              </div>
            </div>

            <button onClick={() => {
              if (!eventDate || !eventName) {
                alert('Please fill in event details');
                return;
              }
              update('onsetDate', eventDate);
              update('dateDelivered', eventDate);
              setMode('capture');
              setStep(0);
            }} 
            disabled={!eventDate || !eventName}
            className="w-full bg-green-600 text-white px-6 py-4 rounded-lg text-lg font-bold disabled:bg-gray-300 hover:bg-green-700 transition flex items-center justify-center gap-2">
              <Camera className="w-6 h-6"/>Start Patient Intake
            </button>
          </div>
        )}

        {mode === 'capture' && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Document Capture</h1>
                <p className="text-gray-600">Date: <strong>{eventDate}</strong></p>
              </div>
              <button onClick={changeEvent} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Change Event</button>
            </div>

            <div className="mb-8 p-6 border-2 border-blue-300 rounded-lg bg-blue-50">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Camera className="w-6 h-6"/>Insurance Card (Optional)</h2>
              
              {/* Front of card */}
              <div className="mb-4">
                <p className="font-medium mb-2">Front of Card:</p>
                <input type="file" ref={insCardFrontRef} onChange={handleInsCardFrontUpload} accept="image/*" className="hidden"/>
                <input type="file" ref={nativeCameraInsFrontRef} onChange={(e) => handleNativeCameraCapture(e, 'insuranceFront')} accept="image/*" capture="environment" className="hidden"/>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => nativeCameraInsFrontRef.current.click()} className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                    <Camera className="w-5 h-5"/>{insuranceCardFrontImg ? 'Retake' : 'Take Photo'}
                  </button>
                  <button onClick={() => insCardFrontRef.current.click()} className="bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600">
                    Choose from Library
                  </button>
                </div>
                {insuranceCardFrontImg && <div className="mt-2"><img src={insuranceCardFrontImg} alt="Insurance Front" className="max-w-xs rounded border-2 border-green-500"/><p className="text-green-600 font-bold mt-1">✓ Front Captured</p></div>}
              </div>
              
              {/* Back of card */}
              <div>
                <p className="font-medium mb-2">Back of Card:</p>
                <input type="file" ref={insCardBackRef} onChange={handleInsCardBackUpload} accept="image/*" className="hidden"/>
                <input type="file" ref={nativeCameraInsBackRef} onChange={(e) => handleNativeCameraCapture(e, 'insuranceBack')} accept="image/*" capture="environment" className="hidden"/>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => nativeCameraInsBackRef.current.click()} className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                    <Camera className="w-5 h-5"/>{insuranceCardBackImg ? 'Retake' : 'Take Photo'}
                  </button>
                  <button onClick={() => insCardBackRef.current.click()} className="bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600">
                    Choose from Library
                  </button>
                </div>
                {insuranceCardBackImg && <div className="mt-2"><img src={insuranceCardBackImg} alt="Insurance Back" className="max-w-xs rounded border-2 border-green-500"/><p className="text-green-600 font-bold mt-1">✓ Back Captured</p></div>}
              </div>
            </div>

            <div className="mb-8 p-6 border-2 rounded-lg">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Scan className="w-6 h-6"/>Driver's License (Optional)</h2>
              <input type="file" ref={dlRef} onChange={handleDLUpload} accept="image/*" className="hidden"/>
              <input type="file" ref={nativeCameraDLRef} onChange={(e) => handleNativeCameraCapture(e, 'license')} accept="image/*" capture="environment" className="hidden"/>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => nativeCameraDLRef.current.click()} className="bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-700">
                  <Camera className="w-5 h-5"/>{driversLicenseImg ? 'Retake' : 'Take Photo'}
                </button>
                <button onClick={() => dlRef.current.click()} className="bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600">
                  Choose from Library
                </button>
              </div>
              {driversLicenseImg && <div className="mt-4"><img src={driversLicenseImg} alt="License" className="max-w-xs rounded border-2 border-green-500"/><p className="text-green-600 font-bold mt-2">✓ Captured</p></div>}
            </div>

            <div className="flex gap-4">
              <button onClick={changeEvent} className="flex-1 bg-gray-200 px-6 py-3 rounded-lg hover:bg-gray-300">← Change Event</button>
              <button onClick={() => {setMode('intake');setStep(1);}} className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">Continue <ChevronRight className="w-5 h-5"/></button>
            </div>
          </div>
        )}

        {mode === 'intake' && step > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">Patient Intake - Step {step} of 7</h1>
                <p className="text-sm text-blue-600">{company ? companies[company].name : 'No company selected'} | Date: {eventDate}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={startNewPatient} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">New Patient</button>
                <button onClick={changeEvent} className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">Change Event</button>
              </div>
            </div>
          </div>
        )}

        {mode === 'intake' && step === 1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4 bg-gray-800 text-white p-2 rounded">PATIENT INFORMATION</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium mb-1">First Name *</label><input type="text" value={data.firstName} onChange={(e) => update('firstName', e.target.value)} className="w-full border rounded px-3 py-2"/></div>
                <div><label className="block text-sm font-medium mb-1">Middle Name</label><input type="text" value={data.middleName} onChange={(e) => update('middleName', e.target.value)} className="w-full border rounded px-3 py-2"/></div>
                <div><label className="block text-sm font-medium mb-1">Last Name *</label><input type="text" value={data.lastName} onChange={(e) => update('lastName', e.target.value)} className="w-full border rounded px-3 py-2"/></div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium mb-1">DOB *</label><input type="date" value={data.dob} onChange={(e) => {update('dob', e.target.value);const age = Math.floor((new Date() - new Date(e.target.value)) / 31557600000);update('age', age.toString());}} max={new Date().toISOString().split('T')[0]} className="w-full border rounded px-3 py-2"/></div>
                <div><label className="block text-sm font-medium mb-1">Age</label><input type="text" value={data.age} readOnly className="w-full border rounded px-3 py-2 bg-gray-100 h-[42px]"/></div>
                <div><label className="block text-sm font-medium mb-1">Sex *</label><div className="flex gap-4 mt-2"><label className="flex items-center"><input type="radio" value="M" checked={data.sex === 'M'} onChange={(e) => update('sex', e.target.value)} className="mr-2"/>Male</label><label className="flex items-center"><input type="radio" value="F" checked={data.sex === 'F'} onChange={(e) => update('sex', e.target.value)} className="mr-2"/>Female</label></div></div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Address *</label><input type="text" value={data.address} onChange={(e) => update('address', e.target.value)} className="w-full border rounded px-3 py-2"/></div>
                <div><label className="block text-sm font-medium mb-1">City *</label><input type="text" value={data.city} onChange={(e) => update('city', e.target.value)} className="w-full border rounded px-3 py-2"/></div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium mb-1">State *</label><input type="text" value={data.state} onChange={(e) => update('state', e.target.value.toUpperCase())} maxLength="2" className="w-full border rounded px-3 py-2"/></div>
                <div><label className="block text-sm font-medium mb-1">ZIP *</label><input type="text" value={data.zip} onChange={(e) => update('zip', e.target.value)} className="w-full border rounded px-3 py-2"/></div>
                <div><label className="block text-sm font-medium mb-1">Phone *</label><input type="tel" value={data.phone} onChange={(e) => update('phone', e.target.value)} className="w-full border rounded px-3 py-2"/></div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Email *</label><input type="email" value={data.email} onChange={(e) => update('email', e.target.value)} className="w-full border rounded px-3 py-2"/></div>
                <div><label className="block text-sm font-medium mb-1">Employer</label><input type="text" value={data.employer} onChange={(e) => update('employer', e.target.value)} className="w-full border rounded px-3 py-2"/></div>
              </div>
            </div>
            <div className="flex justify-end mt-6"><button onClick={() => setStep(2)} className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700">Continue <ChevronRight className="w-5 h-5"/></button></div>
          </div>
        )}

        {mode === 'intake' && step === 2 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4 bg-gray-800 text-white p-2 rounded">INSURANCE INFORMATION</h2>
            {insuranceCardFrontImg && <div className="mb-6"><img src={insuranceCardFrontImg} alt="Insurance Front" className="max-w-sm rounded border"/></div>}
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium mb-1">Primary Insurance *</label>
                  <select value={data.primaryIns} onChange={(e) => {update('primaryIns', e.target.value);autoRouteCompany(e.target.value);}} className="w-full border rounded px-3 py-2">
                    <option value="">Select Insurance</option>
                    <option value="Horizon Blue Cross Blue Shield">Horizon Blue Cross Blue Shield</option>
                    <option value="United Healthcare">United Healthcare</option>
                    <option value="Aetna">Aetna</option>
                    <option value="Meritain">Meritain</option>
                    <option value="Cigna">Cigna</option>
                    <option value="Amerihealth">Amerihealth</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium mb-1">Member ID *</label><input type="text" value={data.primaryID} onChange={(e) => update('primaryID', e.target.value)} className="w-full border rounded px-3 py-2"/></div>
                <div><label className="block text-sm font-medium mb-1">Group #</label><input type="text" value={data.primaryGroup} onChange={(e) => update('primaryGroup', e.target.value)} className="w-full border rounded px-3 py-2"/></div>
              </div>
              {company && <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4"><p className="text-sm text-blue-800"><strong>🏥 Billing:</strong> {companies[company].name} {autoRouted && '(Auto-routed)'}</p></div>}
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)} className="bg-gray-200 px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-300"><ChevronLeft className="w-5 h-5"/>Back</button>
              <button onClick={() => setStep(3)} className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700">Continue <ChevronRight className="w-5 h-5"/></button>
            </div>
          </div>
        )}

        {mode === 'intake' && step === 3 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4 bg-gray-800 text-white p-2 rounded">MEDICAL HISTORY & PRIOR CARE</h2>
            
            <h3 className="font-bold mb-2 bg-gray-200 p-2 rounded">Medical History</h3>
            <div className="grid md:grid-cols-3 gap-3 mb-6">
              {['Diabetes', 'Cardiac Disease', 'Arthritis', 'Respiratory Disorder', 'No Significant Medical History'].map(item => (
                <label key={item} className="flex items-center p-3 border rounded cursor-pointer hover:bg-blue-50">
                  <input type="checkbox" checked={data.medicalHistory.includes(item)} onChange={() => toggleArray('medicalHistory', item)} className="mr-2 w-5 h-5"/>{item}
                </label>
              ))}
            </div>

            <h3 className="font-bold mb-2 bg-gray-200 p-2 rounded">Functional Limitations</h3>
            <div className="grid md:grid-cols-3 gap-3 mb-6">
              {['Difficulty walking', 'Difficulty sitting', 'Difficulty standing', 'Limited bending', 'Sleep disturbance', 'Postural Weakness', 'Reduced ROM', 'Limited Lifting'].map(item => (
                <label key={item} className="flex items-center p-3 border rounded cursor-pointer hover:bg-blue-50">
                  <input type="checkbox" checked={data.limitations.includes(item)} onChange={() => toggleArray('limitations', item)} className="mr-2 w-5 h-5"/>{item}
                </label>
              ))}
            </div>

            <h3 className="font-bold mb-2 bg-gray-200 p-2 rounded">Prior Care</h3>
            <div className="grid md:grid-cols-4 gap-3 mb-4">
              {['Chiropractic', 'Physical Therapy', 'Medication', 'Surgery', 'Injection', 'Home Treatment', 'None'].map(item => (
                <label key={item} className="flex items-center p-3 border rounded cursor-pointer hover:bg-blue-50">
                  <input type="checkbox" checked={data.priorCare.includes(item)} onChange={() => toggleArray('priorCare', item)} className="mr-2 w-5 h-5"/>{item}
                </label>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(2)} className="bg-gray-200 px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-300"><ChevronLeft className="w-5 h-5"/>Back</button>
              <button onClick={() => setStep(4)} className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700">Continue <ChevronRight className="w-5 h-5"/></button>
            </div>
          </div>
        )}

        {mode === 'intake' && step === 4 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4 bg-gray-800 text-white p-2 rounded">CLINICAL ASSESSMENT</h2>
            
            <h3 className="font-bold mb-2 bg-gray-200 p-2 rounded">Chief Complaints *</h3>
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              {[{val:'lbp',label:'Lower back pain'},{val:'lumbar',label:'Lumbar instability'},{val:'degen',label:'Degenerative disc'}].map(item => (
                <label key={item.val} className="flex items-center p-3 border rounded cursor-pointer hover:bg-blue-50">
                  <input type="checkbox" checked={data.complaints.includes(item.val)} onChange={() => toggleArray('complaints',item.val)} className="mr-2 w-5 h-5"/>{item.label}
                </label>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div><label className="block text-sm font-medium mb-1">Onset Date</label><input type="date" value={data.onsetDate} onChange={(e) => update('onsetDate', e.target.value)} max={new Date().toISOString().split('T')[0]} className="w-full border rounded px-3 py-2"/></div>
              <div><label className="block text-sm font-medium mb-1">Duration</label><select value={data.duration} onChange={(e) => update('duration', e.target.value)} className="w-full border rounded px-3 py-2"><option value="">Select</option><option value="Acute (<3 mo)">Acute (&lt;3 mo)</option><option value="Chronic (>3 mo)">Chronic (&gt;3 mo)</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Pain Level (0-10) *</label><select value={data.painLevel} onChange={(e) => update('painLevel', e.target.value)} className="w-full border rounded px-3 py-2"><option value="">Select</option>{[0,1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}{n===0?' - No Pain':n===3?' - Mild':n===6?' - Moderate':n===8?' - Severe':n===10?' - Worst':''}</option>)}</select></div>
            </div>

            <h3 className="font-bold mb-2 bg-gray-200 p-2 rounded mt-6">Objective Assessment</h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Posture/Gait</label>
                <select value={data.postureGait} onChange={(e) => update('postureGait', e.target.value)} className="w-full border rounded px-3 py-2">
                  <option value="">Select</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Antalgic">Antalgic</option>
                  <option value="Guarded">Guarded</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lumbar Mobility</label>
                <select value={data.lumbarMobility} onChange={(e) => update('lumbarMobility', e.target.value)} className="w-full border rounded px-3 py-2">
                  <option value="">Select</option>
                  <option value="Mild Restriction">Mild Restriction</option>
                  <option value="Moderate Restriction">Moderate Restriction</option>
                  <option value="Severe Restriction">Severe Restriction</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Pain Behavior</label>
              <div className="grid md:grid-cols-3 gap-3">
                {['Local Tenderness', 'Muscle Guarding', 'Pain on Movement'].map(item => (
                  <label key={item} className="flex items-center p-3 border rounded cursor-pointer hover:bg-blue-50">
                    <input type="checkbox" checked={data.painBehavior.includes(item)} onChange={() => toggleArray('painBehavior', item)} className="mr-2 w-5 h-5"/>{item}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Functional Impact</label>
              <div className="grid md:grid-cols-2 gap-3">
                {['Limited ADL Performance', 'Difficulty Standing/Sitting', 'Sleep Disturbance'].map(item => (
                  <label key={item} className="flex items-center p-3 border rounded cursor-pointer hover:bg-blue-50">
                    <input type="checkbox" checked={data.functionalImpact.includes(item)} onChange={() => toggleArray('functionalImpact', item)} className="mr-2 w-5 h-5"/>{item}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Other Notes</label>
              <textarea value={data.otherNotes} onChange={(e) => update('otherNotes', e.target.value)} className="w-full border rounded px-3 py-2" rows="2" placeholder="Additional clinical notes..."/>
            </div>

            <div className="mb-4 p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
              <label className="flex items-start cursor-pointer">
                <input type="checkbox" checked={data.mechanicalLBPFindings} onChange={(e) => update('mechanicalLBPFindings', e.target.checked)} className="mr-3 mt-1 w-5 h-5"/>
                <span className="font-bold">Findings are consistent with mechanical low back pain requiring external stabilization to reduce motion, improve function, and decrease pain.</span>
              </label>
            </div>

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(3)} className="bg-gray-200 px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-300"><ChevronLeft className="w-5 h-5"/>Back</button>
              <button onClick={() => setStep(5)} className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700">Continue <ChevronRight className="w-5 h-5"/></button>
            </div>
          </div>
        )}

        {mode === 'intake' && step === 5 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4 bg-gray-800 text-white p-2 rounded">DIAGNOSIS & DEVICE SELECTION</h2>
            
            <div className="mb-6">
              <h3 className="font-bold mb-2 bg-gray-200 p-2 rounded">Primary ICD-10</h3>
              <label className="flex items-center p-3 border-2 rounded bg-blue-50">
                <input type="checkbox" checked={data.primaryICD === 'M54.50'} onChange={(e) => update('primaryICD', e.target.checked ? 'M54.50' : '')} className="mr-3 w-5 h-5"/>
                <span className="font-medium">M54.50 - Low Back Pain, Unspecified</span>
              </label>
            </div>

            <div className="mb-6">
              <h3 className="font-bold mb-2 bg-gray-200 p-2 rounded">Additional ICD-10</h3>
              <div className="space-y-2">
                <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-blue-50">
                  <input type="checkbox" checked={data.additionalICD.includes('M51.16')} onChange={() => toggleArray('additionalICD', 'M51.16')} className="mr-3 w-5 h-5"/>
                  <span>M51.16 - Degenerative Disc Disease (Lumbar)</span>
                </label>
                <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-blue-50">
                  <input type="checkbox" checked={data.additionalICD.includes('M47.819')} onChange={() => toggleArray('additionalICD', 'M47.819')} className="mr-3 w-5 h-5"/>
                  <span>M47.819 - Spondylosis, Unspecified</span>
                </label>
              </div>
            </div>

            <div className="mb-6 p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
              <h3 className="font-bold mb-3">Assessment Summary</h3>
              <p className="mb-3">Evaluation demonstrates mechanical low back pain with postural imbalance and limited motion consistent with need for external stabilization to reduce pain and improve function.</p>
              <div className="mt-4 p-3 bg-red-50 border-2 border-red-400 rounded">
                <label className="flex items-center">
                  <span className="font-bold text-red-800 mr-3">Patient Initials: *</span>
                  <input type="text" value={data.patientInitials} onChange={(e) => update('patientInitials', e.target.value.toUpperCase())} className="border-2 border-red-400 rounded px-3 py-1 w-20 text-center font-bold" maxLength="4"/>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold mb-3 bg-gray-200 p-2 rounded">Devices *</h3>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 rounded cursor-pointer hover:bg-blue-50">
                  <input type="checkbox" checked={data.device.includes('L0631')} onChange={() => toggleArray('device', 'L0631')} className="mr-3 w-6 h-6"/>
                  <div>
                    <div className="font-bold">L0631 - Lumbar Sacral Orthosis</div>
                    <div className="text-sm text-gray-600">Pain reduction and stabilization | Frequency: 6 hours/day</div>
                  </div>
                </label>
                <label className="flex items-center p-4 border-2 rounded cursor-pointer hover:bg-blue-50">
                  <input type="checkbox" checked={data.device.includes('E0730')} onChange={() => toggleArray('device', 'E0730')} className="mr-3 w-6 h-6"/>
                  <div>
                    <div className="font-bold">E0730 - TENS Unit</div>
                    <div className="text-sm text-gray-600">Adjunct pain management</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Length of Need *</label>
                <select value={data.lengthOfNeed} onChange={(e) => update('lengthOfNeed', e.target.value)} className="w-full border rounded px-3 py-2">
                  <option value="3 months">3 Months</option>
                  <option value="6 months">6 Months</option>
                  <option value="12 months">12 Months</option>
                  <option value="Lifetime">Lifetime</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date Delivered</label>
                <input type="date" value={data.dateDelivered} onChange={(e) => update('dateDelivered', e.target.value)} className="w-full border rounded px-3 py-2"/>
              </div>
            </div>

            <div className="p-4 border-2 border-yellow-400 rounded-lg bg-yellow-50 mb-6">
              <h4 className="font-bold mb-2">Compliance Statement</h4>
              <p className="text-sm">This orthosis is not prescribed for comfort or posture correction alone but as part of a structured conservative treatment plan consistent with Aetna CPB #298 and CMS LCD L33802.</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Upload Prescription (Optional)</label>
              <input type="file" ref={rxRef} onChange={handleRxUpload} accept="image/*,application/pdf" className="hidden"/>
              <button onClick={() => rxRef.current.click()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"><Upload className="w-5 h-5"/>Upload Rx</button>
              {patientPrescription && <p className="text-green-600 mt-2">✓ Uploaded</p>}
            </div>

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(4)} className="bg-gray-200 px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-300"><ChevronLeft className="w-5 h-5"/>Back</button>
              <button onClick={() => setStep(6)} className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700">Continue <ChevronRight className="w-5 h-5"/></button>
            </div>
          </div>
        )}

        {mode === 'intake' && step === 6 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4 bg-gray-800 text-white p-2 rounded">SIGNATURES</h2>
            
            <div className="mb-6">
              <h3 className="font-bold mb-2">Provider Attestation</h3>
              <div className="text-sm mb-3 p-3 bg-gray-50 border rounded">
                {providerAttestationText}
              </div>
              <div className="border-2 rounded bg-white" style={{touchAction: 'none'}}>
                <canvas ref={providerCanvasRef} width={700} height={150} className="w-full cursor-crosshair" style={{touchAction: 'none'}}
                  onMouseDown={startDraw(providerCanvasRef)} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                  onTouchStart={startDraw(providerCanvasRef)} onTouchMove={draw} onTouchEnd={stopDraw}/>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => clearSig(providerCanvasRef)} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Clear</button>
                <button onClick={() => saveSig(providerCanvasRef, 'provider')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save</button>
              </div>
              {signatures.provider && <p className="text-sm text-green-600 mt-2">✓ Saved</p>}
            </div>

            <div className="mb-6">
              <h3 className="font-bold mb-2">Patient Acknowledgment</h3>
              <div className="text-sm mb-3 p-3 bg-gray-50 border rounded">
                {patientAcknowledgmentText}
              </div>
              <div className="border-2 rounded bg-white" style={{touchAction: 'none'}}>
                <canvas ref={acknowledgmentCanvasRef} width={700} height={150} className="w-full cursor-crosshair" style={{touchAction: 'none'}}
                  onMouseDown={startDraw(acknowledgmentCanvasRef)} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                  onTouchStart={startDraw(acknowledgmentCanvasRef)} onTouchMove={draw} onTouchEnd={stopDraw}/>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => clearSig(acknowledgmentCanvasRef)} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Clear</button>
                <button onClick={() => saveSig(acknowledgmentCanvasRef, 'acknowledgment')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save</button>
              </div>
              {signatures.acknowledgment && <p className="text-sm text-green-600 mt-2">✓ Saved</p>}
            </div>

            <div className="mb-6">
              <h3 className="font-bold mb-2">HIPAA Acknowledgment</h3>
              <div className="text-sm mb-3 p-3 bg-gray-50 border rounded">
                {hipaaAcknowledgmentText}
              </div>
              <div className="border-2 rounded bg-white" style={{touchAction: 'none'}}>
                <canvas ref={hipaaCanvasRef} width={700} height={150} className="w-full cursor-crosshair" style={{touchAction: 'none'}}
                  onMouseDown={startDraw(hipaaCanvasRef)} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                  onTouchStart={startDraw(hipaaCanvasRef)} onTouchMove={draw} onTouchEnd={stopDraw}/>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => clearSig(hipaaCanvasRef)} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Clear</button>
                <button onClick={() => saveSig(hipaaCanvasRef, 'hipaa')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save</button>
              </div>
              {signatures.hipaa && <p className="text-sm text-green-600 mt-2">✓ Saved</p>}
            </div>

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(5)} className="bg-gray-200 px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-300"><ChevronLeft className="w-5 h-5"/>Back</button>
              <button onClick={() => setStep(7)} className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700">Continue <ChevronRight className="w-5 h-5"/></button>
            </div>
          </div>
        )}

        {mode === 'intake' && step === 7 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4 bg-gray-800 text-white p-2 rounded">REVIEW & PRINT</h2>
            
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-green-800 mb-3 text-xl">✓ Patient Ready!</h3>
              <p className="text-green-700 mb-2"><strong>Patient:</strong> {data.firstName} {data.lastName}</p>
              <p className="text-green-700 mb-2"><strong>Insurance:</strong> {data.primaryIns}</p>
              <p className="text-green-700 mb-2"><strong>Devices:</strong> {data.device.map(d => d === 'L0631' ? 'Lumbar Orthosis' : 'TENS Unit').join(', ')}</p>
              <p className="text-green-700"><strong>Billing To:</strong> {company ? companies[company].name : 'Not selected'}</p>
            </div>

            {/* Checklist - clickable to jump to step */}
            <div className="bg-gray-50 border rounded-lg p-4 mb-6">
              <h4 className="font-bold mb-3">Checklist (tap to edit):</h4>
              <div className="space-y-2 text-sm">
                <div onClick={() => setStep(1)} className={`cursor-pointer hover:bg-gray-200 p-2 rounded ${data.firstName && data.lastName ? 'text-green-600' : 'text-red-600'}`}>
                  {data.firstName && data.lastName ? '✓' : '✗'} Patient name → Step 1
                </div>
                <div onClick={() => setStep(2)} className={`cursor-pointer hover:bg-gray-200 p-2 rounded ${data.primaryIns ? 'text-green-600' : 'text-red-600'}`}>
                  {data.primaryIns ? '✓' : '✗'} Insurance selected → Step 2
                </div>
                <div onClick={() => setStep(5)} className={`cursor-pointer hover:bg-gray-200 p-2 rounded ${data.device.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.device.length > 0 ? '✓' : '✗'} Device selected → Step 5
                </div>
                <div onClick={() => setStep(5)} className={`cursor-pointer hover:bg-gray-200 p-2 rounded ${data.patientInitials ? 'text-green-600' : 'text-red-600'}`}>
                  {data.patientInitials ? '✓' : '✗'} Patient initials → Step 5
                </div>
                <div onClick={() => setStep(6)} className={`cursor-pointer hover:bg-gray-200 p-2 rounded ${signatures.provider ? 'text-green-600' : 'text-red-600'}`}>
                  {signatures.provider ? '✓' : '✗'} Provider signature → Step 6
                </div>
                <div onClick={() => setStep(6)} className={`cursor-pointer hover:bg-gray-200 p-2 rounded ${signatures.acknowledgment ? 'text-green-600' : 'text-red-600'}`}>
                  {signatures.acknowledgment ? '✓' : '✗'} Patient signature → Step 6
                </div>
                <div onClick={() => setStep(6)} className={`cursor-pointer hover:bg-gray-200 p-2 rounded ${signatures.hipaa ? 'text-green-600' : 'text-yellow-600'}`}>
                  {signatures.hipaa ? '✓' : '○'} HIPAA signature (optional) → Step 6
                </div>
              </div>
            </div>

            <div className="flex justify-between mb-4">
              <button onClick={() => setStep(6)} className="bg-gray-200 px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-300"><ChevronLeft className="w-5 h-5"/>Back</button>
            </div>

            <button onClick={handlePrint} className="w-full bg-green-600 text-white px-6 py-4 rounded-lg text-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 mb-4">
              <Printer className="w-8 h-8"/>Print / Save PDF
            </button>
            
            <p className="text-sm text-gray-600 text-center mb-6">Tip: On iPad, tap Share → "Save to Files" to save as PDF</p>

            <div className="flex gap-4">
              <button onClick={startNewPatient} className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700">Next Patient</button>
              <button onClick={changeEvent} className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-700">End Event</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DMEIntakeSystem;
