import { forwardRef } from 'react'
import { Printer } from 'lucide-react'

const StudentCard = forwardRef(({ student }, ref) => {
  const now = new Date()
  const formattedDate = now.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const schoolName = 'MANAGEMENT SYSTEM'
  const schoolAddress = 'Philippines'
  const schoolYear = student?.schoolYear || '2025-2026'

  const field = (label, value) => (
    <p style={{ fontSize: '11px', margin: '2px 0' }}>
      <strong>{label}:</strong> {value || '_______________'}
    </p>
  )

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="hiddenprint">
      <button
        onClick={handlePrint}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 z-50"
      >
        <Printer size={20} />
        Print Enrollment Form
      </button>

      <div ref={ref} className="student-record print-a4">
        <div className="flex items-start justify-between mb-6 pb-4" style={{ borderBottom: '2px solid #333' }}>
          <div className="w-24 h-24 border-2 border-gray-400 rounded flex items-center justify-center">
            <span className="text-xs text-center text-gray-500">2x2<br/>Photo</span>
          </div>
          <div className="text-center flex-1 px-4">
            <p style={{ fontSize: '10px' }}>Republic of the Philippines</p>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '4px 0' }}>{schoolName}</h1>
            <p style={{ fontSize: '11px' }}>{schoolAddress}</p>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '8px', textDecoration: 'underline' }}>STUDENT ENROLLMENT FORM</h2>
            <p style={{ fontSize: '11px', marginTop: '4px' }}>School Year: <strong>{schoolYear}</strong></p>
          </div>
          <div className="w-24 h-24"></div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>PERSONAL INFORMATION</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              {field('Last Name', student?.lastName)}
              {field('First Name', student?.firstName)}
              {field('Middle Name', student?.middleName)}
              {field('Date of Birth', student?.dateOfBirth)}
            </div>
            <div>
              {field('Age', student?.age)}
              {field('Gender', student?.gender)}
              {field('Place of Birth', student?.placeOfBirth)}
              {field('Civil Status', student?.civilStatus)}
            </div>
            <div>
              {field('Nationality', student?.nationality)}
              {field('Religion', student?.religion)}
            </div>
            <div>
              {field('Contact Number', student?.contactNumber)}
              {field('Email', student?.email)}
            </div>
          </div>
          <div style={{ marginTop: '8px' }}>
            {field('Complete Address', student?.address)}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>ACADEMIC INFORMATION</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              {field('Year Level / Grade', student?.yearLevel)}
              {field('Track / Strand', student?.track || student?.strand)}
            </div>
            <div>
              {field('Section', student?.section)}
              {field('Student Type', student?.studentType)}
            </div>
            <div>
              {field('LRN', student?.lrn)}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>FAMILY BACKGROUND</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              {field("Father's Name", student?.fatherName)}
              {field("Father's Occupation", student?.fatherOccupation)}
            </div>
            <div>
              {field("Mother's Name", student?.motherName)}
              {field("Mother's Occupation", student?.motherOccupation)}
            </div>
            <div>
              {field('Guardian Name', student?.guardianName)}
              {field('Relationship', student?.guardianRelationship)}
            </div>
            <div>
              {field('Guardian Contact', student?.guardianContact)}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>EMERGENCY CONTACT</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              {field('Name', student?.emergencyName)}
              {field('Relationship', student?.emergencyRelationship)}
            </div>
            <div>
              {field('Contact Number', student?.emergencyContact)}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <p style={{ fontSize: '11px', fontStyle: 'italic' }}>
            I hereby certify that all information provided in this form is true and correct. 
            I understand that any false statement or omission of information may be considered grounds for 
            disciplinary action or cancellation of enrollment.
          </p>
        </div>

        <div className="signature-line" style={{ marginTop: '24px' }}>
          <div className="signature-block">
            <div className="line"></div>
            <p className="label">Student Signature</p>
            <p className="label" style={{ fontSize: '10px', marginTop: '4px' }}>Date: _______________</p>
          </div>
          <div className="signature-block">
            <div className="line"></div>
            <p className="label">Parent/Guardian Signature</p>
            <p className="label" style={{ fontSize: '10px', marginTop: '4px' }}>Date: _______________</p>
          </div>
        </div>

        <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#e5e5e5', borderRadius: '4px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>FOR OFFICE USE ONLY</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '10px' }}>
            <div>
              {field('Enrollment Date', student?.enrollmentDate || formattedDate)}
              {field('Encoded By', student?.encodedBy)}
            </div>
            <div>
              {field('OR Number', student?.orNumber)}
              {field('Amount Paid', student?.amountPaid ? `₱${parseFloat(student.amountPaid).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '_______________')}
            </div>
            <div>
              {field("Registrar's Signature", ' ')}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px', paddingTop: '8px', borderTop: '1px solid #333', textAlign: 'center' }}>
          <p style={{ fontSize: '9px', color: '#666' }}>
            School Management System | {schoolName}
          </p>
        </div>
      </div>
    </div>
  )
})

export default StudentCard