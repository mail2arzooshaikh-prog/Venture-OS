import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Upload, RotateCcw, Save, AlertCircle, CheckCircle2, Loader2, X, RefreshCw, FileText, Receipt, User, ShoppingCart, ArrowLeft, Sparkles, Info } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { SAMPLE_DOCUMENTS, SAMPLE_INVOICES, SAMPLE_EXPENSES, SAMPLE_CLIENTS, SAMPLE_ORDERS, SAMPLE_ACTIVITY } from '../lib/sampleData'
import { processDocument } from '../lib/api'
import useCamera from '../hooks/useCamera'
import AppLayout from '../components/layout/AppLayout'
import VentureGrid from '../components/background/VentureGrid'

type Mode = 'landing' | 'camera' | 'preview' | 'processing' | 'review' | 'upload' | 'success'

interface ExtractedData {
  vendor?: string
  customer?: string
  documentNumber?: string
  date?: string
  dueDate?: string
  amount?: number | null
  currency?: string
  taxAmount?: number | null
  items?: string[]
  notes?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  company?: string
}

interface ExtractionResult {
  success: boolean
  requiresConfig?: boolean
  documentType: string
  confidence: number
  extractedData: ExtractedData
  warnings?: string[]
  message?: string
}

const DOC_TYPE_ICONS: Record<string, React.ReactNode> = {
  invoice: <FileText size={18} />,
  receipt: <Receipt size={18} />,
  business_card: <User size={18} />,
  order: <ShoppingCart size={18} />,
  contract: <FileText size={18} />,
  other: <FileText size={18} />,
}

const DOC_TYPES = ['invoice', 'receipt', 'business_card', 'order', 'contract', 'other']

const VentureVisionPage: React.FC = () => {
  const { business, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const { videoRef, isActive, isLoading: cameraLoading, error: cameraError, hasPermission, startCamera, stopCamera, captureImage, switchCamera } = useCamera()

  const [mode, setMode] = useState<Mode>('landing')
  const [capturedImage, setCapturedImage] = useState<{ blob: Blob; dataUrl: string } | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [selectedDocType, setSelectedDocType] = useState('invoice')
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null)
  const [reviewData, setReviewData] = useState<ExtractedData>({})
  const [processingStep, setProcessingStep] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<{ type: string; label: string; id?: string } | null>(null)
  const [captureError, setCaptureError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Stop camera when leaving camera mode
  const switchMode = useCallback((newMode: Mode) => {
    if (mode === 'camera' && newMode !== 'camera') {
      stopCamera()
    }
    setCaptureError(null)
    setMode(newMode)
  }, [mode, stopCamera])

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopCamera() }
  }, [stopCamera])

  const openCamera = async () => {
    setMode('camera')
    await startCamera()
  }

  const handleCapture = () => {
    const result = captureImage()
    if (!result) {
      setCaptureError('Failed to capture. Wait for the camera preview to fully load and try again.')
      return
    }
    setCapturedImage(result)
    switchMode('preview')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setUploadError('Please select an image file (JPG, PNG, WEBP) or PDF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File is too large. Maximum size is 10 MB.')
      return
    }
    setUploadedFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => setUploadPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
    setUploadError(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      const fakeEvent = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>
      handleFileSelect(fakeEvent)
    }
  }

  const startProcessing = async () => {
    const imageBlob = capturedImage?.blob || uploadedFile
    if (!imageBlob) return

    setMode('processing')
    setProcessingStep(0)

    // Animate steps
    const stepTimings = [800, 1500, 2500]
    stepTimings.forEach((delay, i) => setTimeout(() => setProcessingStep(i + 1), delay))

    try {
      const formData = new FormData()
      formData.append('document', imageBlob, 'document.jpg')
      if (business?.id) formData.append('businessId', business.id)

      const result = await processDocument(formData)
      const extraction = result as unknown as ExtractionResult
      setExtractionResult(extraction)
      setReviewData(extraction.extractedData || {})
      setSelectedDocType(extraction.documentType || selectedDocType)
      setMode('review')
    } catch (err) {
      console.error('Processing failed:', err)
      // Fall through to manual review
      setExtractionResult({ success: false, requiresConfig: true, documentType: selectedDocType, confidence: 0, extractedData: {}, message: 'Processing failed. Please enter document details manually.' })
      setReviewData({})
      setMode('review')
    }
  }

  const saveDocument = async () => {
    if (!business?.id) return
    setIsSaving(true)

    // Demo Mode fallback persistence
    if (!isSupabaseConfigured || isDemoMode) {
      try {
        let resultInfo: { type: string; label: string; id?: string } = { type: selectedDocType, label: 'Document' }
        const docId = `doc-${Date.now()}`

        // Create new document entry
        const newDoc = {
          id: docId,
          business_id: business.id,
          type: selectedDocType,
          original_filename: uploadedFile?.name || 'camera_capture.jpg',
          storage_path: capturedImage?.dataUrl || uploadPreview || null,
          confidence: extractionResult?.confidence || 0.92,
          review_status: 'confirmed',
          created_at: new Date().toISOString(),
          extracted_data: reviewData,
        }

        const existingDocs = JSON.parse(localStorage.getItem('ventureos_demo_documents') || 'null') || SAMPLE_DOCUMENTS
        localStorage.setItem('ventureos_demo_documents', JSON.stringify([newDoc, ...existingDocs]))

        if (selectedDocType === 'invoice') {
          const invNum = reviewData.documentNumber || `INV-${Date.now().toString().slice(-5)}`
          const newInv = {
            id: `inv-${Date.now()}`,
            business_id: business.id,
            invoice_number: invNum,
            status: 'draft',
            issue_date: reviewData.date || new Date().toISOString().slice(0, 10),
            due_date: reviewData.dueDate || new Date().toISOString().slice(0, 10),
            total: reviewData.amount || 0,
            subtotal: reviewData.amount || 0,
            currency: reviewData.currency || business.currency || 'INR',
            notes: reviewData.notes || '',
            client_id: null,
            clients: { name: reviewData.customer || reviewData.vendor || 'Scanned Client' },
          }
          const existingInvoices = JSON.parse(localStorage.getItem('ventureos_demo_invoices') || 'null') || SAMPLE_INVOICES
          localStorage.setItem('ventureos_demo_invoices', JSON.stringify([newInv, ...existingInvoices]))
          resultInfo = { type: 'invoice', label: `Invoice ${invNum} created`, id: newInv.id }

        } else if (selectedDocType === 'receipt') {
          const newExp = {
            id: `exp-${Date.now()}`,
            business_id: business.id,
            description: reviewData.vendor || reviewData.notes || 'Scanned receipt',
            amount: reviewData.amount || 0,
            currency: reviewData.currency || business.currency || 'INR',
            expense_date: reviewData.date || new Date().toISOString().slice(0, 10),
            vendor: reviewData.vendor || '',
            category: 'other',
            notes: reviewData.notes || '',
          }
          const existingExp = JSON.parse(localStorage.getItem('ventureos_demo_expenses') || 'null') || SAMPLE_EXPENSES
          localStorage.setItem('ventureos_demo_expenses', JSON.stringify([newExp, ...existingExp]))
          resultInfo = { type: 'expense', label: `Expense of ₹${reviewData.amount || 0} logged`, id: newExp.id }

        } else if (selectedDocType === 'business_card') {
          const newClient = {
            id: `c-${Date.now()}`,
            business_id: business.id,
            name: reviewData.contactName || 'New Contact',
            email: reviewData.contactEmail || '',
            phone: reviewData.contactPhone || '',
            company: reviewData.company || '',
            notes: reviewData.notes || '',
            total_billed: 0,
            total_paid: 0,
            is_active: true,
            created_at: new Date().toISOString(),
          }
          const existingClients = JSON.parse(localStorage.getItem('ventureos_demo_clients') || 'null') || SAMPLE_CLIENTS
          localStorage.setItem('ventureos_demo_clients', JSON.stringify([newClient, ...existingClients]))
          resultInfo = { type: 'client', label: `Client ${reviewData.contactName || 'added'}`, id: newClient.id }

        } else if (selectedDocType === 'order') {
          const ordNum = reviewData.documentNumber || `ORD-${Date.now().toString().slice(-5)}`
          const newOrder = {
            id: `ord-${Date.now()}`,
            business_id: business.id,
            order_number: ordNum,
            status: 'pending',
            total: reviewData.amount || 0,
            currency: reviewData.currency || business.currency || 'INR',
            notes: reviewData.notes || '',
            expected_date: new Date().toISOString().slice(0, 10),
            created_at: new Date().toISOString(),
            clients: { name: reviewData.customer || 'Customer' },
          }
          const existingOrders = JSON.parse(localStorage.getItem('ventureos_demo_orders') || 'null') || SAMPLE_ORDERS
          localStorage.setItem('ventureos_demo_orders', JSON.stringify([newOrder, ...existingOrders]))
          resultInfo = { type: 'order', label: `Order ${ordNum} created`, id: newOrder.id }
        }

        // Add activity
        const newAct = {
          id: `act-${Date.now()}`,
          business_id: business.id,
          type: 'document_scanned',
          title: 'Document scanned via Venture Vision',
          description: `${selectedDocType.replace('_', ' ')} processed and ${resultInfo.label}`,
          created_at: new Date().toISOString(),
        }
        const existingAct = JSON.parse(localStorage.getItem('ventureos_demo_activity') || 'null') || SAMPLE_ACTIVITY
        localStorage.setItem('ventureos_demo_activity', JSON.stringify([newAct, ...existingAct]))

        setSaveResult(resultInfo)
        setMode('success')
      } catch (err) {
        console.error('Demo save failed:', err)
        alert('Could not save document in demo mode.')
      } finally {
        setIsSaving(false)
      }
      return
    }

    try {
      // 1. Upload image to storage
      let storagePath: string | null = null
      const imageBlob = capturedImage?.blob || uploadedFile
      if (imageBlob) {
        const filename = `${business.id}/${Date.now()}_document.jpg`
        const { error: uploadErr } = await supabase.storage.from('documents').upload(filename, imageBlob, { contentType: 'image/jpeg', upsert: false })
        if (!uploadErr) storagePath = filename
      }

      // 2. Insert document record
      const { data: doc, error: docErr } = await supabase.from('documents').insert({
        business_id: business.id,
        type: selectedDocType,
        original_filename: uploadedFile?.name || 'camera_capture.jpg',
        storage_path: storagePath,
        file_size: imageBlob?.size || null,
        mime_type: 'image/jpeg',
        extracted_data: reviewData,
        confidence: extractionResult?.confidence || null,
        review_status: 'confirmed',
        processed_at: new Date().toISOString(),
      }).select().single()

      if (docErr) throw new Error(docErr.message)

      // 3. Create linked business record based on document type
      let resultInfo: { type: string; label: string; id?: string } = { type: selectedDocType, label: 'Document' }

      if (selectedDocType === 'invoice') {
        const { data: inv } = await supabase.from('invoices').insert({
          business_id: business.id,
          invoice_number: reviewData.documentNumber || `SCAN-${Date.now().toString().slice(-5)}`,
          status: 'draft',
          issue_date: reviewData.date || new Date().toISOString().slice(0, 10),
          due_date: reviewData.dueDate || null,
          total: reviewData.amount || 0,
          subtotal: reviewData.amount || 0,
          currency: reviewData.currency || business.currency || 'INR',
          notes: reviewData.notes || '',
          document_id: doc?.id,
        }).select().single()
        resultInfo = { type: 'invoice', label: `Invoice ${reviewData.documentNumber || 'created'}`, id: inv?.id }

      } else if (selectedDocType === 'receipt') {
        const { data: exp } = await supabase.from('expenses').insert({
          business_id: business.id,
          description: reviewData.vendor || reviewData.notes || 'Scanned receipt',
          amount: reviewData.amount || 0,
          currency: reviewData.currency || business.currency || 'INR',
          expense_date: reviewData.date || new Date().toISOString().slice(0, 10),
          vendor: reviewData.vendor || '',
          category: 'other',
          notes: reviewData.notes || '',
          document_id: doc?.id,
        }).select().single()
        resultInfo = { type: 'expense', label: 'Expense logged', id: exp?.id }

      } else if (selectedDocType === 'business_card') {
        const { data: client } = await supabase.from('clients').insert({
          business_id: business.id,
          name: reviewData.contactName || 'Unknown Contact',
          email: reviewData.contactEmail || '',
          phone: reviewData.contactPhone || '',
          company: reviewData.company || '',
        }).select().single()
        resultInfo = { type: 'client', label: `Contact: ${reviewData.contactName || 'added'}`, id: client?.id }

      } else if (selectedDocType === 'order') {
        const { data: ord } = await supabase.from('orders').insert({
          business_id: business.id,
          order_number: reviewData.documentNumber || `ORD-${Date.now().toString().slice(-5)}`,
          status: 'pending',
          total: reviewData.amount || 0,
          currency: reviewData.currency || business.currency || 'INR',
          notes: reviewData.notes || '',
          document_id: doc?.id,
        }).select().single()
        resultInfo = { type: 'order', label: `Order ${reviewData.documentNumber || 'created'}`, id: ord?.id }
      }

      // 4. Activity log
      await supabase.from('activity_log').insert({
        business_id: business.id,
        type: 'document_scanned',
        title: 'Document scanned via Venture Vision',
        description: `${selectedDocType.replace('_', ' ')} processed and ${resultInfo.label}`,
      })

      setSaveResult(resultInfo)
      setMode('success')
    } catch (err) {
      console.error('Save failed:', err)
      alert(`Save failed: ${(err as Error).message}. Please try again.`)
    } finally {
      setIsSaving(false)
    }
  }

  const resetAll = () => {
    setCapturedImage(null)
    setUploadedFile(null)
    setUploadPreview(null)
    setExtractionResult(null)
    setReviewData({})
    setSaveResult(null)
    setSelectedDocType('invoice')
    switchMode('landing')
  }

  // ── RENDER MODES ─────────────────────────────────────────────────────────────

  const renderLanding = () => (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '2rem' }}>
      <VentureGrid variant="vision" />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 600, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg,rgba(54,214,231,0.2),rgba(79,140,255,0.2))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '2px solid rgba(54,214,231,0.3)' }}>
          <Camera size={30} style={{ color: 'var(--accent-cyan)' }} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>Venture <span className="text-gradient">Vision</span></h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', lineHeight: 1.7 }}>
          Capture business documents. Let AI extract and organize the data into your workspace.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={openCamera} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem', cursor: 'pointer', border: '2px solid var(--border-subtle)', background: 'none' }}>
            <div style={{ width: 52, height: 52, background: 'rgba(54,214,231,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={24} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Open Camera</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Use your device camera</p>
            </div>
          </button>

          <button onClick={() => switchMode('upload')} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem', cursor: 'pointer', border: '2px solid var(--border-subtle)', background: 'none' }}>
            <div style={{ width: 52, height: 52, background: 'rgba(79,140,255,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={24} style={{ color: 'var(--accent-blue)' }} />
            </div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Upload Document</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>JPG, PNG or PDF</p>
            </div>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Invoice', 'Receipt', 'Business Card', 'Order', 'Contract'].map(t => (
            <span key={t} style={{ padding: '0.3rem 0.75rem', borderRadius: 20, background: 'rgba(79,140,255,0.08)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  )

  const renderCamera = () => (
    <div className="vision-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => { stopCamera(); setMode('landing') }}><ArrowLeft size={16} /> Back</button>
        <h2 style={{ fontWeight: 600 }}>Capture Document</h2>
        {isActive && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--success)', marginLeft: 'auto' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />Camera active</span>}
      </div>

      {/* Camera area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', gap: '1.5rem' }}>
        {cameraError ? (
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{ width: 64, height: 64, background: 'rgba(239,68,68,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <AlertCircle size={28} color="var(--error)" />
            </div>
            <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Camera unavailable</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>{cameraError}</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={openCamera}><RefreshCw size={16} /> Retry</button>
              <button className="btn btn-secondary" onClick={() => switchMode('upload')}><Upload size={16} /> Upload Instead</button>
            </div>
          </div>
        ) : (
          <div className="camera-preview" style={{ position: 'relative', width: '100%', maxWidth: 640, borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#000', aspectRatio: '4/3' }}>
            {cameraLoading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2, gap: '0.75rem' }}>
                <Loader2 size={32} className="spin" style={{ color: 'var(--accent-cyan)' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Starting camera…</span>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Scan frame overlay */}
            <div className="scan-frame" style={{ position: 'absolute', inset: '10%', border: 'none', pointerEvents: 'none' }}>
              {/* Corner markers */}
              {[
                { top: 0, left: 0, borderTop: '3px solid var(--accent-cyan)', borderLeft: '3px solid var(--accent-cyan)' },
                { top: 0, right: 0, borderTop: '3px solid var(--accent-cyan)', borderRight: '3px solid var(--accent-cyan)' },
                { bottom: 0, left: 0, borderBottom: '3px solid var(--accent-cyan)', borderLeft: '3px solid var(--accent-cyan)' },
                { bottom: 0, right: 0, borderBottom: '3px solid var(--accent-cyan)', borderRight: '3px solid var(--accent-cyan)' },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: 24, height: 24, ...s }} />
              ))}
              {/* Decorative scan line */}
              {isActive && <div className="scan-line" style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,var(--accent-cyan),transparent)', opacity: 0.6, animation: 'scan 2.5s linear infinite' }} />}
            </div>
            {/* Decorative label */}
            <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '0.25rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Info size={12} style={{ color: 'var(--accent-cyan)' }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Visual guide only</span>
            </div>
          </div>
        )}

        {!cameraError && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', maxWidth: 400 }}>
            Place the document inside the frame. Ensure good lighting and keep the document steady.
          </p>
        )}

        {captureError && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', maxWidth: 480 }}>
            <AlertCircle size={16} style={{ color: 'var(--error)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--error)' }}>{captureError}</span>
          </div>
        )}

        {!cameraError && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => switchMode('upload')}><Upload size={16} /> Upload Instead</button>
            <button
              onClick={handleCapture}
              disabled={!isActive}
              style={{ width: 64, height: 64, borderRadius: '50%', background: isActive ? 'var(--accent-cyan)' : 'var(--bg-elevated)', border: `3px solid ${isActive ? 'var(--accent-cyan)' : 'var(--border-medium)'}`, cursor: isActive ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            >
              <Camera size={24} color={isActive ? '#080D18' : 'var(--text-muted)'} />
            </button>
            <button className="btn btn-ghost btn-sm" onClick={switchCamera}><RotateCcw size={16} /> Switch</button>
          </div>
        )}
      </div>
    </div>
  )

  const renderPreview = () => (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => { openCamera() }}><ArrowLeft size={16} /> Retake</button>
        <h2 style={{ fontWeight: 700 }}>Review Capture</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' }}>
        <div>
          <img src={capturedImage?.dataUrl || uploadPreview || ''} alt="Captured document" style={{ width: '100%', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', objectFit: 'contain', maxHeight: 500 }} />
        </div>

        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>Quality Check</h4>
            {['Is the text readable?', 'Is the document fully visible?', 'Is the lighting adequate?'].map(q => (
              <label key={q} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent-blue)' }} />
                {q}
              </label>
            ))}
          </div>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Document Type</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {DOC_TYPES.map(t => (
                <button key={t} onClick={() => setSelectedDocType(t)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: `1px solid ${selectedDocType === t ? 'var(--accent-blue)' : 'var(--border-subtle)'}`, background: selectedDocType === t ? 'rgba(79,140,255,0.1)' : 'transparent', cursor: 'pointer', color: selectedDocType === t ? 'var(--accent-blue)' : 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'capitalize' }}>
                  {DOC_TYPE_ICONS[t]} {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={startProcessing}>
            <Sparkles size={16} /> Process Document
          </button>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} onClick={resetAll}>
            <X size={16} /> Cancel
          </button>
        </div>
      </div>
    </div>
  )

  const renderProcessing = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '2rem', padding: '3rem' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(79,140,255,0.15)', border: '2px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--accent-blue)' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Processing document…</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Venture Vision is analyzing your document with AI.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: 320 }}>
        {[
          { label: 'Image captured', step: 0 },
          { label: 'Analyzing content', step: 1 },
          { label: 'Extracting data', step: 2 },
          { label: 'Organizing information', step: 3 },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: processingStep >= s.step ? 1 : 0.3, transition: 'opacity 0.4s ease' }}>
            {processingStep > s.step ? <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0 }} /> : processingStep === s.step ? <Loader2 size={18} className="spin" style={{ color: 'var(--accent-blue)', flexShrink: 0 }} /> : <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--border-medium)', flexShrink: 0 }} />}
            <span style={{ fontSize: '0.875rem', color: processingStep >= s.step ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const renderReview = () => (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 700, flex: 1 }}>Review Extracted Data</h2>
        {extractionResult?.confidence && extractionResult.confidence > 0 && (
          <span style={{ background: 'rgba(79,140,255,0.1)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: '0.25rem 0.75rem', fontSize: '0.8rem', color: 'var(--accent-blue)' }}>
            {Math.round(extractionResult.confidence * 100)}% confident
          </span>
        )}
      </div>

      {(extractionResult?.requiresConfig || !extractionResult?.success) && (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', marginBottom: '1.5rem' }}>
          <AlertCircle size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: 500, color: 'var(--warning)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>AI extraction not configured</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Please fill in the document details manually below.</p>
          </div>
        </div>
      )}

      {extractionResult?.warnings?.map((w, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(245,158,11,0.08)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', marginBottom: '0.5rem' }}>
          <AlertCircle size={14} style={{ color: 'var(--warning)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>{w}</span>
        </div>
      ))}

      {/* Document type */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <label className="label">Document Type</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {DOC_TYPES.map(t => (
            <button key={t} onClick={() => setSelectedDocType(t)} className={`btn btn-sm ${selectedDocType === t ? 'btn-primary' : 'btn-ghost'}`} style={{ textTransform: 'capitalize' }}>
              {DOC_TYPE_ICONS[t]} {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Editable fields */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {DOC_TYPE_ICONS[selectedDocType]} {selectedDocType.replace('_', ' ')} details
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {selectedDocType === 'business_card' ? (
            <>
              <EditField label="Contact Name" value={reviewData.contactName} onChange={v => setReviewData(d => ({ ...d, contactName: v }))} />
              <EditField label="Email" value={reviewData.contactEmail} onChange={v => setReviewData(d => ({ ...d, contactEmail: v }))} />
              <EditField label="Phone" value={reviewData.contactPhone} onChange={v => setReviewData(d => ({ ...d, contactPhone: v }))} />
              <EditField label="Company" value={reviewData.company} onChange={v => setReviewData(d => ({ ...d, company: v }))} />
            </>
          ) : (
            <>
              {(selectedDocType === 'invoice' || selectedDocType === 'receipt') && <EditField label="Vendor / From" value={reviewData.vendor} onChange={v => setReviewData(d => ({ ...d, vendor: v }))} />}
              {selectedDocType === 'invoice' && <EditField label="Customer / To" value={reviewData.customer} onChange={v => setReviewData(d => ({ ...d, customer: v }))} />}
              {(selectedDocType === 'invoice' || selectedDocType === 'order') && <EditField label="Document Number" value={reviewData.documentNumber} onChange={v => setReviewData(d => ({ ...d, documentNumber: v }))} placeholder="INV-001 / ORD-001" />}
              <EditField label="Date" value={reviewData.date} onChange={v => setReviewData(d => ({ ...d, date: v }))} type="date" />
              {selectedDocType === 'invoice' && <EditField label="Due Date" value={reviewData.dueDate} onChange={v => setReviewData(d => ({ ...d, dueDate: v }))} type="date" />}
              <EditField label="Amount" value={reviewData.amount?.toString()} onChange={v => setReviewData(d => ({ ...d, amount: parseFloat(v) || null }))} type="number" placeholder="0.00" />
              <EditField label="Notes" value={reviewData.notes} onChange={v => setReviewData(d => ({ ...d, notes: v }))} multiline />
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-ghost" onClick={resetAll} style={{ flex: '0 0 auto' }}><X size={16} /> Start Over</button>
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={saveDocument} disabled={isSaving}>
          {isSaving ? <><Loader2 size={16} className="spin" /> Saving…</> : <><Save size={16} /> Save Document</>}
        </button>
      </div>
    </div>
  )

  const renderUpload = () => (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => switchMode('landing')}><ArrowLeft size={16} /> Back</button>
        <h2 style={{ fontWeight: 700 }}>Upload Document</h2>
      </div>

      <div
        className="upload-zone"
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ border: `2px dashed ${uploadedFile ? 'var(--accent-blue)' : 'var(--border-medium)'}`, borderRadius: 'var(--radius-lg)', padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', marginBottom: '1rem', background: uploadedFile ? 'rgba(79,140,255,0.05)' : 'transparent', transition: 'all 0.2s' }}
      >
        {uploadPreview ? (
          <img src={uploadPreview} alt="Preview" style={{ maxHeight: 240, maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }} />
        ) : (
          <>
            <Upload size={36} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Drop file here or click to browse</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>JPG, PNG, PDF — max 10 MB</p>
          </>
        )}
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleFileSelect} />
      </div>

      {uploadedFile && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>📄 {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)</p>}

      {uploadError && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          <AlertCircle size={16} />{uploadError}
        </div>
      )}

      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={!uploadedFile} onClick={() => { setCapturedImage(null); setMode('preview') }}>
        <Sparkles size={16} /> Process this Document
      </button>
    </div>
  )

  const renderSuccess = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem', padding: '3rem', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, background: 'rgba(34,197,94,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(34,197,94,0.3)' }}>
        <CheckCircle2 size={36} color="var(--success)" />
      </div>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Document Saved!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{saveResult?.label}</p>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn btn-ghost" onClick={resetAll}><Camera size={16} /> Scan Another</button>
        {saveResult?.type === 'invoice' && <button className="btn btn-secondary" onClick={() => navigate('/invoices')}>View Invoices</button>}
        {saveResult?.type === 'expense' && <button className="btn btn-secondary" onClick={() => navigate('/expenses')}>View Expenses</button>}
        {saveResult?.type === 'client' && <button className="btn btn-secondary" onClick={() => navigate('/clients')}>View Clients</button>}
        {saveResult?.type === 'order' && <button className="btn btn-secondary" onClick={() => navigate('/orders')}>View Orders</button>}
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Dashboard</button>
      </div>
    </div>
  )

  const content = () => {
    switch (mode) {
      case 'landing': return renderLanding()
      case 'camera': return renderCamera()
      case 'preview': return renderPreview()
      case 'processing': return renderProcessing()
      case 'review': return renderReview()
      case 'upload': return renderUpload()
      case 'success': return renderSuccess()
    }
  }

  // Landing and success don't use AppLayout (full screen)
  if (mode === 'landing') return content()
  return <AppLayout>{content()}</AppLayout>
}

// Helper editable field component
const EditField: React.FC<{ label: string; value?: string | null; onChange: (v: string) => void; type?: string; placeholder?: string; multiline?: boolean }> = ({ label, value, onChange, type = 'text', placeholder, multiline }) => (
  <div>
    <label className="label">{label}</label>
    {multiline ? (
      <textarea className="input" rows={2} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    ) : (
      <input className="input" type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    )}
  </div>
)

export default VentureVisionPage
