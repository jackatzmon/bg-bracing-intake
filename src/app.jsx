import React, { useState, useRef, useEffect } from 'react';
import { Camera, ChevronRight, ChevronLeft, Printer, Upload, Scan, Wifi, WifiOff } from 'lucide-react';

const DMEIntakeSystem = () => {
  const [mode, setMode] = useState('setup');
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState(null);
  const [eventDate, setEventDate] = useState('');
  const [eventName, setEventName] = useState('');
  const [insuranceCardImg, setInsuranceCardImg] = useState(null);
  const [driversLicenseImg, setDriversLicenseImg] = useState(null);
  const [autoRouted, setAutoRouted] = useState(false);
  const [signatures, setSigs] = useState({provider: null, acknowledgment: null, hipaa: null});
  const [drawing, setDrawing] = useState(false);
  const [activeCanvas, setActiveCanvas] = useState(null);
  const [patientPrescription, setPatientPrescription] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSaved, setLastSaved] = useState(null);
  
  const insCardRef = useRef(null);
  const dlRef = useRef(null);
  const rxRef = useRef(null);
  const providerCanvasRef = useRef(null);
  const acknowledgmentCanvasRef = useRef(null);
  const hipaaCanvasRef = useRef(null);
  
  const companies = {
    bgbracing: {
      name: 'BG Bracing, LLC',
      address: '84 Hopper Avenue',
      city: 'Pompton Plains',
      state: 'NJ',
      zip: '07457',
      phone: '(973) 363-9011',
      fax: '(973) 341-7791',
      npi: '1234567890',
      taxId: '12-3456789',
      referringProvider: 'Dr. Jack Atzmon, DC',
      referringNPI: '1962565648'
    },
    njback: {
      name: 'NJback Chiropractic Center, LLC',
      address: '456 Wellness Ave',
      city: 'Your City',
      state: 'NJ',
      zip: '07002',
      phone: '(555) 987-6543',
      fax: '(555) 987-6544',
      npi: '0987654321',
      taxId: '98-7654321',
      referringProvider: 'Dr. Your Name, DC',
      referringNPI: '1234567890'
    }
  };

  const [data, setData] = useState({
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
    mechanicalLBPFindings: false
  });

  const update = (field, value) => setData(prev => ({...prev, [field]: value}));
  
  const toggleArray = (field, value) => {
    const arr = data[field];
    update(field, arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  };

  // Auto-save to localStorage every time data changes
  useEffect(() => {
    if (mode === 'intake' && step > 0) {
      const saveData = {
        mode,
        step,
        company,
        eventDate,
        eventName,
        data,
        signatures,
        insuranceCardImg,
        driversLicenseImg,
        patientPrescription,
        autoRouted,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('dme-intake-current', JSON.stringify(saveData));
      setLastSaved(new Date().toLocaleTimeString());
    }
  }, [data, step, mode, signatures, company, eventDate, eventName, insuranceCardImg, driversLicenseImg, patientPrescription, autoRouted]);

  // Load saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem('dme-intake-current');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (window.confirm(`Resume saved session from ${new Date(parsed.timestamp).toLocaleString()}?`)) {
          setMode(parsed.mode);
          setStep(parsed.step);
          setCompany(parsed.company);
          setEventDate(parsed.eventDate);
          setEventName(parsed.eventName);
          setData(parsed.data);
          setSigs(parsed.signatures);
          setInsuranceCardImg(parsed.insuranceCardImg);
          setDriversLicenseImg(parsed.driversLicenseImg);
          setPatientPrescription(parsed.patientPrescription);
          setAutoRouted(parsed.autoRouted);
        }
      } catch (e) {
        console.error('Error loading saved data:', e);
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

  const extractInsuranceData = (imageData) => {
    const insuranceName = prompt('📋 Insurance Company:\n(e.g., Horizon BCBS, United Healthcare, Aetna)');
    const memberId = prompt('🔢 Member ID:');
    const groupNumber = prompt('👥 Group Number (optional):');
    const patientName = prompt('👤 Patient Name on Card:');
    
    if (insuranceName) {
      update('primaryIns', insuranceName);
      autoRouteCompany(insuranceName);
    }
    if (memberId) update('primaryID', memberId);
    if (groupNumber) update('primaryGroup', groupNumber);
    
    if (patientName) {
      const parts = patientName.trim().split(/\s+/);
      if (parts.length >= 2) {
        update('firstName', parts[0]);
        update('lastName', parts[parts.length - 1]);
        if (parts.length === 3) update('middleName', parts[1]);
      }
    }
  };

  const extractLicenseData = (imageData) => {
    const firstName = prompt('👤 First Name:');
    const lastName = prompt('👤 Last Name:');
    const dob = prompt('🎂 DOB (YYYY-MM-DD):');
    const address = prompt('🏠 Address:');
    const city = prompt('🏙️ City:');
    const state = prompt('📍 State (2 letters):');
    const zip = prompt('📮 ZIP:');
    const sex = prompt('⚧️ Sex (M/F):');
    
    if (firstName) update('firstName', firstName);
    if (lastName) update('lastName', lastName);
    if (dob) {
      update('dob', dob);
      const age = Math.floor((new Date() - new Date(dob)) / 31557600000);
      update('age', age.toString());
    }
    if (address) update('address', address);
    if (city) update('city', city);
    if (state) update('state', state.toUpperCase());
    if (zip) update('zip', zip);
    if (sex) update('sex', sex.toUpperCase());
  };

  const handleInsCardUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setInsuranceCardImg(evt.target.result);
      setTimeout(() => extractInsuranceData(evt.target.result), 500);
    };
    reader.readAsDataURL(file);
  };

  const handleDLUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setDriversLicenseImg(evt.target.result);
      setTimeout(() => extractLicenseData(evt.target.result), 500);
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

  const startDraw = (canvasRef) => (e) => {
    setActiveCanvas(canvasRef);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = e.touches ? (e.touches[0].clientX - rect.left) * scaleX : (e.clientX - rect.left) * scaleX;
    const y = e.touches ? (e.touches[0].clientY - rect.top) * scaleY : (e.clientY - rect.top) * scaleY;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing || !activeCanvas) return;
    e.preventDefault();
    const canvas = activeCanvas.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = e.touches ? (e.touches[0].clientX - rect.left) * scaleX : (e.clientX - rect.left) * scaleX;
    const y = e.touches ? (e.touches[0].clientY - rect.top) * scaleY : (e.clientY - rect.top) * scaleY;
    ctx.lineTo(x, y);
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
      setData({
        firstName: '', lastName: '', middleName: '', age: '', dob: '', sex: '', 
        address: '', city: '', state: '', zip: '', phone: '', email: '', employer: '',
        primaryIns: '', primaryID: '', primaryGroup: '',
        complaints: [], onsetDate: eventDate, duration: '', painLevel: '6', painDesc: [],
        limitations: [], priorCare: [], medicalHistory: [],
        device: [], dateDelivered: eventDate, patientInitials: '',
        primaryICD: 'M54.50',
        additionalICD: [],
        postureGait: '',
        lumbarMobility: '',
        painBehavior: [],
        functionalImpact: [],
        otherNotes: '',
        mechanicalLBPFindings: false
      });
      setSigs({provider: null, acknowledgment: null, hipaa: null});
      setInsuranceCardImg(null);
      setDriversLicenseImg(null);
      setPatientPrescription(null);
      setAutoRouted(false);
      setCompany(null);
      setMode('capture');
      setStep(0);
    }
  };

  const changeEvent = () => {
    if (window.confirm('Change event? All data will be cleared.')) {
      setMode('setup');
      setStep(0);
      setEventDate('');
      setEventName('');
      setCompany(null);
      setAutoRouted(false);
      setInsuranceCardImg(null);
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
        mechanicalLBPFindings: false
      });
      setSigs({provider: null, acknowledgment: null, hipaa: null});
    }
  };

  const generatePacketHTML = () => {
    const fullName = `${data.firstName} ${data.middleName ? data.middleName + ' ' : ''}${data.lastName}`;
    const today = eventDate || new Date().toLocaleDateString();
    const companyInfo = companies[company] || companies.bgbracing;
    
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>DME Claim - ${fullName}</title><style>@page{size:letter;margin:0.5in}body{font-family:Arial,sans-serif;font-size:10pt;margin:0;padding:20px}.header{text-align:center;margin-bottom:20px;border-bottom:3px solid #000;padding-bottom:10px}.company-name{font-size:18pt;font-weight:bold}.section-title{background:#333;color:white;padding:8px;font-weight:bold;margin-top:15px}.field{margin:5px 0}.label{font-weight:bold;display:inline-block;min-width:150px}.sig-img{max-height:60px;border-bottom:2px solid #000;margin-top:5px}table{width:100%;border-collapse:collapse;margin:10px 0}th,td{border:1px solid #000;padding:8px;text-align:left}th{background:#e0e0e0;font-weight:bold}ul{margin:5px 0 5px 20px}.box{border:2px solid #000;padding:10px;margin:10px 0;background:#f9f9f9}.highlight-box{border:2px solid #06c;background:#e8f4fd;padding:10px;margin:10px 0}.red-box{border:2px solid #c00;background:#fee;padding:10px;margin:10px 0;font-weight:bold}.yellow-box{border:2px solid #c90;background:#fffbea;padding:10px;margin:10px 0}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body><div class="header"><div class="company-name">${companyInfo.name}</div><div>${companyInfo.address}, ${companyInfo.city}, ${companyInfo.state} ${companyInfo.zip}</div><div>Phone: ${companyInfo.phone} | NPI: ${companyInfo.npi}</div><div style="margin-top:10px;font-size:14pt;font-weight:bold">DME CLAIM PACKET</div><div>Event: ${eventName} | ${eventDate}</div></div><div class="section-title">PATIENT INFORMATION</div><div class="field"><span class="label">Name:</span> ${fullName}</div><div class="field"><span class="label">DOB:</span> ${data.dob} | <span class="label">Age:</span> ${data.age} | <span class="label">Sex:</span> ${data.sex}</div><div class="field"><span class="label">Address:</span> ${data.address}, ${data.city}, ${data.state} ${data.zip}</div><div class="field"><span class="label">Phone:</span> ${data.phone} | <span class="label">Email:</span> ${data.email}</div><div class="section-title">INSURANCE</div><div class="field"><span class="label">Insurance:</span> ${data.primaryIns} | <span class="label">ID:</span> ${data.primaryID}</div><div class="section-title">CLINICAL ASSESSMENT</div><div class="field"><span class="label">Pain Level:</span> ${data.painLevel}/10 | <span class="label">Onset:</span> ${data.onsetDate}</div>${data.mechanicalLBPFindings ? '<div class="highlight-box">✓ Findings consistent with mechanical low back pain requiring external stabilization</div>' : ''}<div class="section-title">DIAGNOSIS</div><div class="field">✓ M54.50 - Low Back Pain</div>${data.additionalICD.map(icd => `<div class="field">✓ ${icd}</div>`).join('')}<div class="red-box">Patient Initials: ${data.patientInitials || '______'}</div><div class="section-title">DEVICES</div><table><tr><th>Device</th><th>Code</th></tr>${data.device.includes('L0631') ? '<tr><td>Lumbar Sacral Orthosis</td><td>L0631</td></tr>' : ''}${data.device.includes('E0730') ? '<tr><td>TENS Unit</td><td>E0730</td></tr>' : ''}</table><div class="section-title">SIGNATURES</div><div class="field"><span class="label">Provider:</span> ${companyInfo.referringProvider}</div>${signatures.provider ? `<img src="${signatures.provider}" class="sig-img"/>` : '<div>_______________________</div>'}<div class="field" style="margin-top:20px"><span class="label">Patient:</span></div>${signatures.acknowledgment ? `<img src="${signatures.acknowledgment}" class="sig-img"/>` : '<div>_______________________</div>'}</body></html>`;
  };

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      alert('Please allow popups');
      return;
    }
    win.document.write(generatePacketHTML());
    win.document.close();
    win.onload = () => setTimeout(() => {win.focus();win.print()}, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Online/Offline Status Indicator */}
        {mode === 'intake' && (
          <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isOnline ? <Wifi className="w-5 h-5"/> : <WifiOff className="w-5 h-5"/>}
            <div>
              <div className="font-bold">{isOnline ? 'Online' : 'Offline'}</div>
              {lastSaved && <div className="text-xs">Saved: {lastSaved}</div>}
            </div>
          </div>
        )}
        
        {mode === 'setup' && (
          <div className="bg-white rounded-lg shadow p-8">
            <h1 className="text-3xl font-bold mb-6">Event Setup</h1>
            
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">1. Event Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Event Name *</label>
                  <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g., Springfield Health Fair 2024" className="w-full border-2 rounded-lg px-4 py-3 text-lg"/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Event Date *</label>
                  <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="w-full border-2 rounded-lg px-4 py-3 text-lg"/>
                </div>
              </div>
            </div>

            <button onClick={() => {
              if (!company && !eventDate && !eventName) {
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
                <p className="text-gray-600">Event: <strong>{eventName}</strong> | <strong>{eventDate}</strong></p>
              </div>
              <button onClick={changeEvent} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Change Event</button>
            </div>

            <div className="mb-8 p-6 border-2 border-blue-300 rounded-lg bg-blue-50">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Camera className="w-6 h-6"/>Insurance Card (Optional)</h2>
              <input type="file" ref={insCardRef} onChange={handleInsCardUpload} accept="image/*" capture="environment" className="hidden"/>
              <button onClick={() => insCardRef.current.click()} className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                <Camera className="w-5 h-5"/>{insuranceCardImg ? 'Retake' : 'Capture'} Insurance Card
              </button>
              {insuranceCardImg && <div className="mt-4"><img src={insuranceCardImg} alt="Insurance" className="max-w-md rounded border-2 border-green-500"/><p className="text-green-600 font-bold mt-2">✓ Captured {autoRouted && `→ ${company === 'njback' ? 'NJback' : 'BG Bracing'}`}</p></div>}
            </div>

            <div className="mb-8 p-6 border-2 rounded-lg">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Scan className="w-6 h-6"/>Driver's License (Optional)</h2>
              <input type="file" ref={dlRef} onChange={handleDLUpload} accept="image/*" capture="environment" className="hidden"/>
              <button onClick={() => dlRef.current.click()} className="bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-700">
                <Camera className="w-5 h-5"/>{driversLicenseImg ? 'Retake' : 'Capture'} License
              </button>
              {driversLicenseImg && <div className="mt-4"><img src={driversLicenseImg} alt="License" className="max-w-md rounded border-2 border-green-500"/><p className="text-green-600 font-bold mt-2">✓ Captured</p></div>}
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
                <h1 className="text-2xl font-bold">Patient Intake - Step {step} of 6</h1>
                <p className="text-sm text-blue-600">{company ? companies[company].name : 'No company selected'} | Event: {eventName} ({eventDate})</p>
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
            {driversLicenseImg ? (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6"><p className="text-sm text-blue-800">ℹ️ Auto-filled from license. Please review.</p></div>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6"><p className="text-sm text-yellow-800">⚠️ Manual entry required.</p></div>
            )}
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium mb-1">First Name *</label><input type="text" value={data.firstName} onChange={(e) => update('firstName', e.target.value)} className="w-full border rounded px-3 py-2"/></div>
                <div><label className="block text-sm font-medium mb-1">Middle Name</label><input type="text" value={data.middleName} onChange={(e) => update('middleName', e.target.value)} className="w-full border rounded px-3 py-2"/></div>
                <div><label className="block text-sm font-medium mb-1">Last Name *</label><input type="text" value={data.lastName} onChange={(e) => update('lastName', e.target.value)} className="w-full border rounded px-3 py-2"/></div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium mb-1">DOB *</label><input type="date" value={data.dob} onChange={(e) => {update('dob', e.target.value);const age = Math.floor((new Date() - new Date(e.target.value)) / 31557600000);update('age', age.toString());}} max={new Date().toISOString().split('T')[0]} className="w-full border rounded px-3 py-2"/></div>
                <div><label className="block text-sm font-medium mb-1">Age</label><input type="number" value={data.age} readOnly className="w-full border rounded px-3 py-2 bg-gray-100"/></div>
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
            {insuranceCardImg ? <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4 mb-6"><p className="text-sm text-green-800">✓ Auto-filled from card</p></div> : <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6"><p className="text-sm text-yellow-800">⚠️ Manual entry</p></div>}
            {insuranceCardImg && <div className="mb-6"><img src={insuranceCardImg} alt="Insurance" className="max-w-sm rounded border"/></div>}
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
            <h2 className="text-lg font-bold mb-4 bg-gray-800 text-white p-2 rounded">CLINICAL ASSESSMENT</h2>
            <h3 className="font-bold mb-2 bg-gray-200 p-2 rounded">Chief Complaints *</h3>
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              {[{val:'lbp',label:'Lower back pain'},{val:'lumbar',label:'Lumbar instability'},{val:'degen',label:'Degenerative disc'}].map(item => <label key={item.val} className="flex items-center p-3 border rounded cursor-pointer hover:bg-blue-50"><input type="checkbox" checked={data.complaints.includes(item.val)} onChange={() => toggleArray('complaints',item.val)} className="mr-2 w-5 h-5"/>{item.label}</label>)}
            </div>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div><label className="block text-sm font-medium mb-1">Onset Date</label><input type="date" value={data.onsetDate} onChange={(e) => update('onsetDate', e.target.value)} max={new Date().toISOString().split('T')[0]} className="w-full border rounded px-3 py-2"/></div>
              <div><label className="block text-sm font-medium mb-1">Duration</label><select value={data.duration} onChange={(e) => update('duration', e.target.value)} className="w-full border rounded px-3 py-2"><option value="">Select</option><option value="Acute (<3 mo)">Acute (&lt;3 mo)</option><option value="Chronic (>3 mo)">Chronic (&gt;3 mo)</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Pain Level (0-10) *</label><select value={data.painLevel} onChange={(e) => update('painLevel', e.target.value)} className="w-full border rounded px-3 py-2"><option value="">Select</option>{[0,1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}{n===0?' - No Pain':n===3?' - Mild':n===6?' - Moderate':n===8?' - Severe':n===10?' - Worst':''}</option>)}</select></div>
            </div>
            <div className="mb-4 p-4 border-2 border-blue-300 rounded-lg bg-blue-50"><label className="flex items-start cursor-pointer"><input type="checkbox" checked={data.mechanicalLBPFindings} onChange={(e) => update('mechanicalLBPFindings', e.target.checked)} className="mr-3 mt-1 w-5 h-5"/><span className="font-bold">Findings consistent with mechanical low back pain requiring external stabilization</span></label></div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(2)} className="bg-gray-200 px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-300"><ChevronLeft className="w-5 h-5"/>Back</button>
              <button onClick={() => setStep(4)} className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700">Continue <ChevronRight className="w-5 h-5"/></button>
            </div>
          </div>
        )}

        {mode === 'intake' && step === 4 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4 bg-gray-800 text-white p-2 rounded">DEVICE SELECTION</h2>
            <div className="mb-6">
              <h3 className="font-bold mb-2 bg-gray-200 p-2 rounded">Primary Diagnosis</h3>
              <label className="flex items-center p-3 border-2 rounded"><input type="checkbox" checked={data.primaryICD === 'M54.50'} onChange={(e) => update('primaryICD', e.target.checked ? 'M54.50' : '')} className="mr-3 w-5 h-5"/><span className="font-medium">M54.50 - Low Back Pain</span></label>
            </div>
            <div className="mb-6 p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
              <h3 className="font-bold mb-3">UM Assessment</h3>
              <p className="mb-3">Evaluation demonstrates mechanical low back pain with postural imbalance and limited motion.</p>
              <div className="mt-4 p-3 bg-red-50 border-2 border-red-400 rounded"><label className="flex items-center"><span className="font-bold text-red-800 mr-3">Patient Initials: *</span><input type="text" value={data.patientInitials} onChange={(e) => update('patientInitials', e.target.value)} className="border-2 border-red-400 rounded px-3 py-1 w-20 text-center font-bold" maxLength="3"/></label></div>
            </div>
            <div className="mb-6">
              <h3 className="font-bold mb-3 bg-gray-200 p-2 rounded">Devices *</h3>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 rounded cursor-pointer hover:bg-blue-50"><input type="checkbox" checked={data.device.includes('L0631')} onChange={() => toggleArray('device', 'L0631')} className="mr-3 w-6 h-6"/><div><div className="font-bold">L0631 - Lumbar Sacral Orthosis</div><div className="text-sm text-gray-600">Pain reduction and stabilization</div></div></label>
                <label className="flex items-center p-4 border-2 rounded cursor-pointer hover:bg-blue-50"><input type="checkbox" checked={data.device.includes('E0730')} onChange={() => toggleArray('device', 'E0730')} className="mr-3 w-6 h-6"/><div><div className="font-bold">E0730 - TENS Unit</div><div className="text-sm text-gray-600">Adjunct pain management</div></div></label>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Upload Prescription (Optional)</label>
              <input type="file" ref={rxRef} onChange={handleRxUpload} accept="image/*,application/pdf" className="hidden"/>
              <button onClick={() => rxRef.current.click()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"><Upload className="w-5 h-5"/>Upload Rx</button>
              {patientPrescription && <p className="text-green-600 mt-2">✓ Uploaded</p>}
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(3)} className="bg-gray-200 px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-300"><ChevronLeft className="w-5 h-5"/>Back</button>
              <button onClick={() => setStep(5)} className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700">Continue <ChevronRight className="w-5 h-5"/></button>
            </div>
          </div>
        )}

        {mode === 'intake' && step === 5 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4 bg-gray-800 text-white p-2 rounded">SIGNATURES</h2>
            <div className="mb-6">
              <h3 className="font-bold mb-2">Provider Attestation</h3>
              <p className="text-sm mb-3 p-3 bg-gray-50 border rounded">I certify that I personally evaluated the patient and determined the prescribed orthosis is medically necessary.</p>
              <div className="border-2 rounded bg-white">
                <canvas ref={providerCanvasRef} width={700} height={150} className="w-full touch-none cursor-crosshair"
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
              <p className="text-sm mb-3 p-3 bg-gray-50 border rounded">I authorize release of medical information and acknowledge financial responsibility.</p>
              <div className="border-2 rounded bg-white">
                <canvas ref={acknowledgmentCanvasRef} width={700} height={150} className="w-full touch-none cursor-crosshair"
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
              <p className="text-sm mb-3 p-3 bg-gray-50 border rounded">I acknowledge receipt of Notice of Privacy Practices.</p>
              <div className="border-2 rounded bg-white">
                <canvas ref={hipaaCanvasRef} width={700} height={150} className="w-full touch-none cursor-crosshair"
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
              <button onClick={() => setStep(4)} className="bg-gray-200 px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-300"><ChevronLeft className="w-5 h-5"/>Back</button>
              <button onClick={() => setStep(6)} className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700">Continue <ChevronRight className="w-5 h-5"/></button>
            </div>
          </div>
        )}

        {mode === 'intake' && step === 6 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4 bg-gray-800 text-white p-2 rounded">PRINT CLAIM PACKET</h2>
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-green-800 mb-3 text-xl">✓ Ready to Print!</h3>
              <p className="text-green-700 mb-4">Complete claim packet ready with all information and signatures.</p>
            </div>
            <button onClick={handlePrint} className="w-full bg-green-600 text-white px-6 py-4 rounded-lg text-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 mb-4">
              <Printer className="w-8 h-8"/>Print Claim Packet
            </button>
            <div className="flex gap-4">
              <button onClick={startNewPatient} className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700">New Patient (Same Event)</button>
              <button onClick={changeEvent} className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-700">Change Event</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DMEIntakeSystem;
